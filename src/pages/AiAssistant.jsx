import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IonIcon, IonToast } from '@ionic/react';
import {
  sendOutline, sparklesOutline, trashOutline, copyOutline,
  settingsOutline, openOutline, eyeOutline, eyeOffOutline,
  refreshOutline,
} from 'ionicons/icons';
import { getDB } from '../services/db';
import { getAllFormulas } from '../services/formulaService';
import {
  loadIAConfig, saveIAConfig, loadModels, testKey,
  callGemini, loadHistory, clearHistory, saveHistoryLocally,
} from '../services/aiService';

/* ─── Sugestões ─── */
const SUGGESTIONS = [
  'Resumo dos meus clientes',
  'Qual cliente tem mais orçamentos?',
  'Quantos orçamentos foram aprovados?',
  'Qual o valor total dos orçamentos?',
  'Liste os produtos com estoque baixo',
  'Quantas fórmulas tenho?',
  'Dica de produtividade',
  'Sugira uma estratégia de vendas',
];

/* ─── Context builder (fallback offline — quando server está online, o server busca do MongoDB) ─── */
function buildContext() {
  const db = getDB();
  const formulas = getAllFormulas();
  const clientes = db.clientes.map(c => `${c.nome} (${c.tipo}, ${c.status}, doc:${c.documento})`).join('; ') || 'Nenhum';
  const produtos = db.produtos.map(p => `${p.nome} [${p.categoria}] R$${p.valor} estoque:{p.estoque} (${p.status})`).join('; ') || 'Nenhum';
  const orcamentos = db.orcamentos.map(o => {
    const cli = db.clientes.find(c => c.id === o.clienteId)?.nome || '?';
    return `${o.codigo} - ${cli} - ${o.descricao} - R$$$${o.valor} (${o.status})`;
  }).join('; ') || 'Nenhum';
  const formulaInfo = formulas.map(f => `${f.nome}: ${f.latex} [vars: ${(f.variaveis || []).join(',')}]`).join('; ') || 'Nenhuma';

  return `Você é a IA assistente do sistema Angler de gestão empresarial. Responda em português brasileiro. Use markdown (negrito com **, listas com -). Seja direto e útil.

DADOS DO SISTEMA:
- Total: ${db.clientes.length} clientes, ${db.produtos.length} produtos, ${db.orcamentos.length} orçamentos, ${formulas.length} fórmulas
- Clientes: ${clientes}
- Produtos: ${produtos}
- Orçamentos: ${orcamentos}
- Fórmulas: ${formulaInfo}`;
}

/* ─── Respostas locais (sem API) ─── */
function localResponse(pergunta) {
  const db = getDB();
  const formulas = getAllFormulas();
  const lower = pergunta.toLowerCase();

  if (lower.includes('resumo') && lower.includes('cliente')) {
    const total = db.clientes.length;
    const ativos = db.clientes.filter(c => c.status === 'Ativo').length;
    const pj = db.clientes.filter(c => c.tipo === 'PJ').length;
    const ticket = db.clientes.reduce((a, c) => a + db.orcamentos.filter(o => o.clienteId === c.id).reduce((s, o) => s + o.valor, 0), 0) / Math.max(total, 1);
    return `**Resumo dos Clientes:**\n\n- **Total:** ${total} clientes\n- **Ativos:** ${ativos} | **Inativos:** ${total - ativos}\n- **Pessoa Jurídica:** ${pj} | **Outros:** ${total - pj}\n- **Ticket médio:** R$ ${ticket.toFixed(2)}`;
  }

  if (lower.includes('cliente') && (lower.includes('mais') || lower.includes('principal'))) {
    const byClient = {};
    db.orcamentos.forEach(o => { byClient[o.clienteId] = (byClient[o.clienteId] || 0) + 1; });
    const sorted = Object.entries(byClient).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return 'Nenhum orçamento encontrado.';
    return `**Top Clientes:**\n\n${sorted.slice(0, 5).map(([id, count], i) => {
      const c = db.clientes.find(x => x.id === id);
      const valor = db.orcamentos.filter(o => o.clienteId === id).reduce((a, o) => a + o.valor, 0);
      return `${i + 1}. **${c?.nome || '?'}** — ${count} orçamento(s), R$ ${valor.toFixed(2)}`;
    }).join('\n')}`;
  }

  if (lower.includes('aprovado')) {
    const aprovados = db.orcamentos.filter(o => o.status === 'Aprovado');
    const valor = aprovados.reduce((a, o) => a + o.valor, 0);
    return `**Aprovados:** ${aprovados.length} de ${db.orcamentos.length}\n**Valor:** R$ ${valor.toFixed(2)}\n**Taxa:** ${db.orcamentos.length ? ((aprovados.length / db.orcamentos.length) * 100).toFixed(1) : 0}%`;
  }

  if (lower.includes('valor') && lower.includes('total')) {
    const total = db.orcamentos.reduce((a, o) => a + o.valor, 0);
    const aprov = db.orcamentos.filter(o => o.status === 'Aprovado').reduce((a, o) => a + o.valor, 0);
    return `**Total:** R$ ${total.toFixed(2)}\n**Aprovados:** R$ ${aprov.toFixed(2)}\n**Em aberto:** R$ ${(total - aprov).toFixed(2)}`;
  }

  if (lower.includes('estoque') && lower.includes('baixo')) {
    const low = db.produtos.filter(p => p.estoque <= 10);
    if (!low.length) return 'Todos os produtos têm estoque acima de 10 unidades.';
    return `**Estoque Baixo:**\n\n${low.map(p => `- **${p.nome}**: ${p.estoque} unidades`).join('\n')}`;
  }

  if (lower.includes('fórmula') || lower.includes('formula')) {
    if (lower.includes('quantas') || lower.includes('total')) return `**Fórmulas:** ${formulas.length} total, ${formulas.filter(f => f.constantes?.length > 0).length} com constantes.`;
    if (formulas.length === 0) return 'Nenhuma fórmula cadastrada.';
    return `**Fórmulas:**\n\n${formulas.map(f => `- **${f.nome}**: ${f.descricao || 'Sem descrição'}`).join('\n')}`;
  }

  if (lower.includes('dica') || lower.includes('sugest')) {
    const tips = [];
    const r = db.orcamentos.filter(o => o.status === 'Rascunho').length;
    if (r > 0) tips.push(`${r} orçamento(s) em rascunho — considere enviá-los.`);
    const i = db.clientes.filter(c => c.status === 'Inativo').length;
    if (i > 0) tips.push(`${i} cliente(s) inativos — verifique reativações.`);
    const l = db.produtos.filter(p => p.estoque <= 5).length;
    if (l > 0) tips.push(`${l} produto(s) com estoque crítico.`);
    if (!tips.length) return '**Tudo em ordem!**';
    return `**Dicas:**\n\n${tips.map(t => '- ' + t).join('\n')}`;
  }

  if (lower.includes('orçamento')) {
    return `**Orçamentos (${db.orcamentos.length}):**\n\n${['Rascunho', 'Enviado', 'Aprovado', 'Rejeitado', 'Expirado'].map(s => `- **${s}:** ${db.orcamentos.filter(o => o.status === s).length}`).join('\n')}`;
  }

  if (lower.includes('produto')) {
    if (!db.produtos.length) return 'Nenhum produto cadastrado.';
    return `**Produtos (${db.produtos.length}):**\n\n${db.produtos.map(p => `- **${p.nome}** R$ ${p.valor} — Estoque: ${p.estoque}`).join('\n')}`;
  }



  return null;
}

/* ─── Markdown ─── */
const MarkdownText = ({ text }) => {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:var(--surface);padding:1px 4px;border-radius:3px;font-family:DM Mono,monospace;font-size:12px;">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: html }} />;
};

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */

export default function AiAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const endRef = useRef(null);

  // Settings
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Init: load config, models, history
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Load config
    const config = await loadIAConfig();
    setApiKey(config.apiKey || '');
    setModel(config.model || 'gemini-2.0-flash');
    setServerOnline(config.online || false);

    // Load models
    refreshModels();

    // Load history
    const history = await loadHistory();
    if (history.length > 0) setMessages(history);
  };

  const refreshModels = useCallback(async () => {
    setModelsLoading(true);
    const list = await loadModels();
    setAvailableModels(list);
    const current = model;
    if (!list.includes(current)) {
      const newModel = list[0] || 'gemini-2.0-flash';
      setModel(newModel);
    }
    setModelsLoading(false);
  }, [model]);

  const showToast = (msg, color = 'success') => { setToast(msg); setToastColor(color); };

  const hasKey = !!apiKey?.trim();

  /* ─── Send ─── */
  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Local response if no key
      const local = localResponse(msg);
      if (!hasKey) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
        const reply = local || 'Configure a chave do Gemini nas Configurações para respostas avançadas.';
        const updated = [...newMessages, { role: 'assistant', content: reply, source: 'local' }];
        setMessages(updated);
        saveHistoryLocally(updated);
        setLoading(false);
        return;
      }

      // Call Gemini (server proxy or direct)
      const systemMsg = { role: 'system', content: buildContext() };
      const apiMessages = [
        systemMsg,
        ...messages.slice(-10).filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: msg },
      ];
      const reply = await callGemini(apiMessages, model);

      if (reply) {
        const updated = [...newMessages, { role: 'assistant', content: reply, source: 'gemini' }];
        setMessages(updated);
        saveHistoryLocally(updated);
        setLoading(false);
        return;
      }

      // Fallback local
      const fallback = local || 'Não consegui responder. Tente novamente.';
      const updated = [...newMessages, { role: 'assistant', content: fallback, source: 'local' }];
      setMessages(updated);
      saveHistoryLocally(updated);
    } catch (err) {
      const updated = [...newMessages, { role: 'assistant', content: err.message, source: 'error' }];
      setMessages(updated);
      saveHistoryLocally(updated);
    }
    setLoading(false);
  };

  const clear = () => {
    setMessages([]);
    clearHistory();
  };

  const copyMsg = (text) => {
    navigator.clipboard.writeText(text.replace(/\*\*/g, '').replace(/`/g, ''));
    showToast('Copiado!');
  };

  const handleSaveKey = async () => {
    await saveIAConfig(apiKey, model);
    showToast(hasKey ? 'Chave salva!' : 'Chave removida');
    if (hasKey) refreshModels();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testKey(apiKey);
    setTestResult(result);
    setTesting(false);
    if (result.ok) {
      await saveIAConfig(apiKey, model);
      refreshModels();
    }
  };

  const handleSelectModel = async (m) => {
    setModel(m);
    await saveIAConfig(apiKey, m);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>

      {/* ═══ Header ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #4285f4, #34a853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            ✦
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Assistente IA</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>
              {hasKey ? `Gemini · ${model}` : 'Modo offline'}
              {serverOnline && <span style={{ color: 'var(--green)', marginLeft: 8 }}>· Sincronizado</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {messages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clear}>
              <IonIcon icon={trashOutline} style={{ fontSize: 14, marginRight: 4 }} /> Limpar
            </button>
          )}
          <button className={`btn btn-sm ${showSettings ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowSettings(!showSettings)}>
            <IonIcon icon={settingsOutline} style={{ fontSize: 14, marginRight: 4 }} /> Configurações
          </button>
        </div>
      </div>

      {/* ═══ Settings ═══ */}
      {showSettings && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✦</span> Configurar Google Gemini
          </div>

          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Para usar a IA avançada, você precisa de uma chave do Google. É gratuita para começar.
            <br />
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#4285f4', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              Gerar minha chave grátis <IonIcon icon={openOutline} style={{ fontSize: 12 }} />
            </a>
          </div>

          {/* Server status */}
          <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: serverOnline ? 'rgba(14,203,129,.06)' : 'rgba(255,165,0,.06)', border: `1px solid ${serverOnline ? 'rgba(14,203,129,.2)' : 'rgba(255,165,0,.2)'}`, fontSize: 12, color: serverOnline ? 'var(--green)' : '#e8a020' }}>
            {serverOnline ? '✓ Servidor conectado — dados sincronizados com MongoDB' : 'Servidor offline — dados salvos apenas neste dispositivo'}
          </div>

          {/* Key input */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>Sua Chave de API</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onBlur={handleSaveKey}
                  placeholder="Cole sua chave aqui (AIza...)"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 40px 10px 14px', color: 'var(--text)',
                    fontFamily: "'DM Mono',monospace", fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    display: 'flex', alignItems: 'center', color: 'var(--muted)',
                  }}
                  title={showKey ? 'Ocultar' : 'Mostrar'}
                >
                  <IonIcon icon={showKey ? eyeOffOutline : eyeOutline} style={{ fontSize: 18 }} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleTest}
                disabled={testing || !apiKey?.trim()}
                style={{ minWidth: 80 }}
              >
                {testing ? 'Testando...' : 'Testar'}
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div style={{
              fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: testResult.ok ? 'rgba(14,203,129,.08)' : 'rgba(255,71,87,.08)',
              border: `1px solid ${testResult.ok ? 'rgba(14,203,129,.25)' : 'rgba(255,71,87,.25)'}`,
              color: testResult.ok ? 'var(--green)' : 'var(--red)',
              lineHeight: 1.5,
            }}>
              {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
            </div>
          )}

          {/* Model selector */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>Modelo</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={model}
                onChange={e => handleSelectModel(e.target.value)}
                disabled={modelsLoading}
                style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, outline: 'none' }}
              >
                {modelsLoading ? (
                  <option>Carregando modelos...</option>
                ) : (
                  availableModels.map(m => <option key={m} value={m}>{m}</option>)
                )}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={refreshModels}
                disabled={modelsLoading}
                title="Atualizar lista"
                style={{ minWidth: 40 }}
              >
                <IonIcon icon={refreshOutline} style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: hasKey ? 'rgba(14,203,129,.06)' : 'rgba(255,255,255,.03)', border: `1px solid ${hasKey ? 'rgba(14,203,129,.2)' : 'var(--border)'}`, fontSize: 12, color: hasKey ? 'var(--green)' : 'var(--muted)' }}>
            {hasKey ? `✓ Conectado ao Google Gemini com o modelo "${model}"` : 'Cole sua chave acima para ativar a IA avançada'}
          </div>
        </div>
      )}

      {/* ═══ Chat ═══ */}
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 4 }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #4285f4, #34a853)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 32, opacity: 0.85 }}>
              ✦
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Como posso ajudar?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, textAlign: 'center', maxWidth: 460, lineHeight: 1.5 }}>
              Pergunte sobre seus clientes, orçamentos, produtos ou fórmulas.
              {hasKey
                ? <span style={{ color: 'var(--green)', display: 'block', marginTop: 4 }}>Conectado ao Google Gemini</span>
                : <span style={{ display: 'block', marginTop: 4 }}>Funciona offline. Abra <strong>Configurações</strong> para ativar o Gemini.</span>
              }
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 640 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="btn btn-ghost btn-sm" onClick={() => send(s)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20 }}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '14px 18px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  position: 'relative',
                }}>
                  {m.role === 'user' ? (
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--bg)' }}>{m.content}</div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 10, fontFamily: "'DM Mono',monospace",
                        color: m.source === 'error' ? 'var(--red)' : 'var(--muted)',
                        marginBottom: 6,
                      }}>
                        {m.source === 'gemini' ? `✦ Gemini · ${model}` : m.source === 'error' ? 'Aviso' : 'Resposta offline'}
                      </div>
                      <MarkdownText text={m.content} />
                      <button className="btn-icon" onClick={() => copyMsg(m.content)} style={{ position: 'absolute', top: 8, right: 8, opacity: 0.3 }} title="Copiar">
                        <IonIcon icon={copyOutline} style={{ fontSize: 12 }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '14px 18px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>Gemini pensando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* ═══ Input ═══ */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={hasKey ? 'Pergunte algo para o Gemini...' : 'Pergunte algo (modo offline)...'}
          disabled={loading}
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 18px', color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
        />
        <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ borderRadius: 12, padding: '12px 18px', minWidth: 48 }}>
          <IonIcon icon={sendOutline} style={{ fontSize: 20 }} />
        </button>
      </div>

      <style>{`
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: typingBounce 1.4s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={2000} color={toastColor} position="bottom" />
    </div>
  );
}