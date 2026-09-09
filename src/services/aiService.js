import { api } from './api';

let serverAvailable = false;

async function checkServer() {
  try {
    const resp = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
    serverAvailable = resp.ok;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

// Config
export async function loadIAConfig() {
  const online = await checkServer();
  if (online) {
    try {
      const config = await api.getIAConfig();
      return { apiKey: config.apiKey || '', model: config.model || 'gemini-2.0-flash', online: true };
    } catch { }
  }
  return {
    apiKey: localStorage.getItem('angler_gemini_key') || '',
    model: localStorage.getItem('angler_gemini_model') || 'gemini-2.0-flash',
    online: false,
  };
}

export async function saveIAConfig(apiKey, model) {
  localStorage.setItem('angler_gemini_key', apiKey || '');
  localStorage.setItem('angler_gemini_model', model || 'gemini-2.0-flash');
  const online = await checkServer();
  if (online) {
    try {
      await api.saveIAConfig(apiKey, model);
      return { ok: true, msg: 'Chave salva no servidor!', saved: 'server' };
    } catch (err) {
      return { ok: false, msg: `Salvo localmente, mas falhou no servidor: ${err.message}`, saved: 'local' };
    }
  }
  return { ok: true, msg: 'Salvo localmente (servidor offline).', saved: 'local' };
}

// Models
export async function loadModels() {
  const online = await checkServer();
  if (online) {
    try {
      const data = await api.getModels();
      if (data.models?.length > 0) return data.models;
    } catch { }
  }
  // Fallback: tentar diretamente com chave do localStorage
  const key = localStorage.getItem('angler_gemini_key');
  if (key) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (r.ok) {
        const data = await r.json();
        const models = (data.models || [])
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace('models/', ''))
          .sort();
        if (models.length > 0) return models;
      }
    } catch { }
  }
  return ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
}

// Test key
export async function testKey(apiKey) {
  if (!apiKey?.trim()) return { ok: false, msg: 'Cole a chave de API primeiro.' };
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!r.ok) {
      if (r.status === 400) return { ok: false, msg: 'Chave inválida. Verifique se copiou corretamente.' };
      return { ok: false, msg: `Erro ${r.status}. Tente novamente.` };
    }
    const data = await r.json();
    const count = data.models?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))?.length || 0;
    return { ok: true, msg: `Tudo certo! ${count} modelos disponíveis.` };
  } catch {
    return { ok: false, msg: 'Não consegui conectar. Verifique sua internet.' };
  }
}

// ═══ Construir contexto local com TODOS os dados do cliente ═══
function buildLocalContext() {
  let clientes = [], produtos = [], orcamentos = [], formulas = [];
  try {
    const db = JSON.parse(localStorage.getItem('anglerDB')) || {};
    clientes = db.clientes || [];
    produtos = db.produtos || [];
    orcamentos = db.orcamentos || [];
  } catch { }
  try { formulas = JSON.parse(localStorage.getItem('angler_formulas')) || []; } catch { }

  // FIX1: incluir TODOS os campos do cliente
  const clientesStr = clientes.map(c => {
    const parts = [
      c.nome, c.tipo, c.status,
      c.documento ? `doc:${c.documento}` : '',
      c.email ? `email:${c.email}` : '',
      c.telefone ? `tel:${c.telefone}` : '',
      c.endereco ? `end:${c.endereco}` : '',
      c.cidade ? `cidade:${c.cidade}` : '',
      c.cep ? `cep:${c.cep}` : '',
      c.observacoes ? `obs:${c.observacoes}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  }).join('\n- ') || 'Nenhum';

  const produtosStr = produtos.map(p =>
    `${p.nome} [${p.categoria}] R$${p.valor} estoque:${p.estoque} (${p.status})${p.descricao ? ' — ' + p.descricao : ''}`
  ).join('\n- ') || 'Nenhum';
  const orcamentosStr = orcamentos.map(o => {
    const cli = clientes.find(c => c.id === o.clienteId)?.nome || '?';
    return `${o.codigo} — ${cli} — ${o.descricao} — R$${o.valor} (${o.status})${o.data ? ' — ' + o.data : ''}`;
  }).join('\n- ') || 'Nenhum';
  const formulasStr = formulas.map(f =>
    `${f.nome}: ${f.latex} [vars: ${(f.variaveis || []).join(',')} | constantes: ${(f.constantes || []).map(c => c.nome + '=' + c.valor).join(',')}]`
  ).join('\n- ') || 'Nenhuma';

  const orcAprovados = orcamentos.filter(o => o.status === 'Aprovado');
  const receitaTotal = orcAprovados.reduce((a, o) => a + (o.valor || 0), 0);

  return `Você é a IA assistente do sistema Angler de gestão empresarial.

REGRAS:
- Responda SEMPRE em português brasileiro
- Use markdown: **negrito**, listas com -, código com backticks
- Seja direto, útil e profissional
- Nunca invente dados que não estão no contexto abaixo

RESUMO: ${clientes.length} clientes, ${produtos.length} produtos, ${orcamentos.length} orçamentos, ${formulas.length} fórmulas. Receita aprovada: R$ ${receitaTotal.toFixed(2)}

CLIENTES (TODOS OS DADOS):
- ${clientesStr}

PRODUTOS:
- ${produtosStr}

ORÇAMENTOS:
- ${orcamentosStr}

FÓRMULAS:
- ${formulasStr}`;
}

// Chat — prioriza server, fallback com dados locais completos
export async function callGemini(messages, model) {
  const key = localStorage.getItem('angler_gemini_key');
  if (!key) throw new Error('Configure a chave do Gemini nas Configurações.');

  const useModel = model || 'gemini-2.0-flash';

  const online = await checkServer();
  if (online) {
    try {
      const reply = await api.chat(messages, useModel);
      return reply.reply || '';
    } catch (err) {
      throw err;
    }
  }

  // FALLBACK OFFLINE: injetar dados do localStorage
  const localContext = buildLocalContext();
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = {
    contents,
    systemInstruction: { parts: [{ text: localContext }] },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=***`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const errMsg = err.error?.message || `Erro ${ resp.status }`;
    if (errMsg.includes('quota') || errMsg.includes('429') || resp.status === 429) {
      throw new Error('Limite diário atingido. Aguarde até amanhã ou ative o faturamento no Google AI Studio.');
    }
    if (errMsg.includes('not found') || resp.status === 404) throw new Error('Modelo não disponível.');
    if (errMsg.includes('high demand') || resp.status === 503) throw new Error('Muita gente usando. Espere 1 minuto.');
    if (resp.status === 403) throw new Error('Acesso negado. Verifique se a API está ativada.');
    throw new Error('Erro ao conectar. Tente novamente.');
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}


// History
export async function loadHistory() {
  const online = await checkServer();
  if (online) {
    try { return await api.getHistory(); } catch {}
  }
  try { return JSON.parse(localStorage.getItem('angler_chat_history')) || []; } catch { return []; }
}

export async function clearHistory() {
  localStorage.removeItem('angler_chat_history');
  const online = await checkServer();
  if (online) {
    try { await api.clearHistory(); } catch {}
  }
}

export function saveHistoryLocally(messages) {
  localStorage.setItem('angler_chat_history', JSON.stringify(messages.slice(-100)));
}