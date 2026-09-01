const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

/* ─── Helpers: buscar dados do MongoDB ─── */
async function fetchUserData(username) {
  const db = getDb();
  const sections = ['clients/info', 'products/info', 'budgets/info', 'formulas/info'];
  const results = await Promise.all(
    sections.map(s => db.collection('user_data').findOne({ username, section: s }))
  );
  return {
    clientes: results[0]?.data?.clientes || [],
    produtos: results[1]?.data?.produtos || [],
    orcamentos: results[2]?.data?.orcamentos || [],
    notasFiscais: results[2]?.data?.notasFiscais || [],
    formulas: results[3]?.data?.formulas || [],
  };
}

function buildServerContext(data) {
  const { clientes, produtos, orcamentos, notasFiscais, formulas } = data;

  const clientesStr = clientes.map(c =>
    `${c.nome} (${c.tipo}, ${c.status}, doc:${c.documento}, email:${c.email}, tel:${c.telefone})`
  ).join('\n- ') || 'Nenhum';

  const produtosStr = produtos.map(p =>
    `${p.nome} [${p.categoria}] R$${p.valor} estoque:${p.estoque} (${p.status})${p.descricao ? ' — ' + p.descricao : ''}`
  ).join('\n- ') || 'Nenhum';

  const orcamentosStr = orcamentos.map(o => {
    const cli = clientes.find(c => c.id === o.clienteId)?.nome || '?';
    return `${o.codigo} — ${cli} — ${o.descricao} — R$${o.valor} (${o.status})${o.data ? ' — ' + o.data : ''}`;
  }).join('\n- ') || 'Nenhum';

  const nfsStr = notasFiscais.map(n =>
    `${n.numero} R$${n.valorTotal} (${n.status})${n.data ? ' — ' + n.data : ''}`
  ).join('\n- ') || 'Nenhuma';

  const formulasStr = formulas.map(f =>
    `${f.nome}: ${f.latex} [vars: ${(f.variaveis || []).join(',')} | constantes: ${(f.constantes || []).map(c => c.nome + '=' + c.valor).join(',')}]`
  ).join('\n- ') || 'Nenhuma';

  // Estatísticas úteis
  const orcAprovados = orcamentos.filter(o => o.status === 'Aprovado');
  const receitaTotal = orcAprovados.reduce((a, o) => a + (o.valor || 0), 0);
  const clientesAtivos = clientes.filter(c => c.status === 'Ativo').length;
  const produtosBaixoEstoque = produtos.filter(p => p.estoque <= 10).length;

  return `Você é a IA assistente do sistema Angler de gestão empresarial.

REGRAS:
- Responda SEMPRE em português brasileiro
- Use markdown: **negrito**, listas com -, código com backticks
- Seja direto, útil e profissional
- Quando listar dados, use tabelas ou listas organizadas
- Se a pergunta for sobre dados que não existem, informe claramente
- Nunca invente dados que não estão no contexto abaixo
- Se o usuário pedir para criar/editar/excluir algo, oriente-o a usar a tela correspondente no sistema

RESUMO GERAL:
- ${clientes.length} clientes (${clientesAtivos} ativos)
- ${produtos.length} produtos (${produtosBaixoEstoque} com estoque baixo ≤10)
- ${orcamentos.length} orçamentos (${orcAprovados.length} aprovados)
- ${notasFiscais.length} notas fiscais
- ${formulas.length} fórmulas cadastradas
- Receita total (aprovados): R$ ${receitaTotal.toFixed(2)}

--- DADOS COMPLETOS DO SISTEMA ---

CLIENTES (${clientes.length}):
- ${clientesStr}

PRODUTOS (${produtos.length}):
- ${produtosStr}

ORÇAMENTOS (${orcamentos.length}):
- ${orcamentosStr}

NOTAS FISCAIS (${notasFiscais.length}):
- ${nfsStr}

FÓRMULAS (${formulas.length}):
- ${formulasStr}`;
}

/* ─── Rotas ─── */

// Salvar chave API (criptografada)
router.put('/config', auth, async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const db = getDb();

    const data = {};
    if (apiKey !== undefined) data.encryptedKey = apiKey ? encrypt(apiKey) : '';
    if (model !== undefined) data.model = model;

    await db.collection('user_data').updateOne(
      { username: req.username, section: 'ia/config' },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configuração.' });
  }
});

// Ler config
router.get('/config', auth, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('user_data').findOne({ username: req.username, section: 'ia/config' });
    if (!doc?.data) return res.json({ apiKey: '', model: 'gemini-2.0-flash' });

    res.json({
      apiKey: doc.data.encryptedKey ? decrypt(doc.data.encryptedKey) : '',
      model: doc.data.model || 'gemini-2.0-flash',
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configuração.' });
  }
});

// Chat — busca dados do MongoDB e injeta no contexto
router.post('/chat', auth, async (req, res) => {
  try {
    const { messages, model } = req.body;
    const db = getDb();

    // Buscar chave criptografada
    const config = await db.collection('user_data').findOne({ username: req.username, section: 'ia/config' });
    const apiKey = config?.data?.encryptedKey ? decrypt(config.data.encryptedKey) : '';
    if (!apiKey) return res.status(400).json({ error: 'Configure a chave do Gemini nas Configurações.' });

    const useModel = model || config?.data?.model || 'gemini-2.0-flash';

    // ═══ BUSCAR DADOS FRESCOS DO MONGODB ═══
    const userData = await fetchUserData(req.username);
    const serverContext = buildServerContext(userData);

    // Montar mensagens para o Gemini
    // O system message do frontend é substituído pelo serverContext (mais completo e fresco)
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      systemInstruction: { parts: [{ text: serverContext }] },
    };

    // Chamar Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const errMsg = err.error?.message || `Erro ${resp.status}`;

      if (errMsg.includes('quota') || errMsg.includes('429')) {
        return res.status(429).json({ error: 'Limite de uso atingido. Aguarde 1 minuto e tente de novo.' });
      }
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        return res.status(400).json({ error: 'Modelo não disponível. Atualize a lista de modelos nas Configurações.' });
      }
      if (errMsg.includes('high demand') || errMsg.includes('503')) {
        return res.status(503).json({ error: 'Muita gente usando agora. Espere 1 minutinho.' });
      }
      return res.status(400).json({ error: errMsg });
    }

    const data = await resp.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Salvar no histórico
    await db.collection('user_data').updateOne(
      { username: req.username, section: 'ia/history' },
      {
        $push: {
          'data.messages': {
            $each: [
              { role: 'user', content: messages[messages.length - 1].content, ts: new Date() },
              { role: 'assistant', content: reply, source: 'gemini', model: useModel, ts: new Date() },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    res.json({ reply, model: useModel });
  } catch (err) {
    res.status(500).json({ error: 'Erro de conexão. Verifique sua internet.' });
  }
});

// Buscar histórico
router.get('/history', auth, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('user_data').findOne({ username: req.username, section: 'ia/history' });
    res.json(doc?.data?.messages || []);
  } catch {
    res.json([]);
  }
});

// Limpar histórico
router.delete('/history', auth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('user_data').updateOne(
      { username: req.username, section: 'ia/history' },
      { $set: { data: { messages: [] }, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao limpar histórico.' });
  }
});

// Listar modelos do Gemini
router.get('/models', auth, async (req, res) => {
  try {
    const db = getDb();
    const config = await db.collection('user_data').findOne({ username: req.username, section: 'ia/config' });
    const apiKey = config?.data?.encryptedKey ? decrypt(config.data.encryptedKey) : '';
    if (!apiKey) return res.json({ models: ['gemini-2.0-flash'] });

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!r.ok) return res.json({ models: ['gemini-2.0-flash'] });

    const data = await r.json();
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .sort();

    res.json({ models: models.length > 0 ? models : ['gemini-2.0-flash'] });
  } catch {
    res.json({ models: ['gemini-2.0-flash'] });
  }
});

module.exports = router;
