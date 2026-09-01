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
    } catch {}
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
    try { await api.saveIAConfig(apiKey, model); } catch {}
  }
}

// Models
export async function loadModels() {
  const online = await checkServer();
  if (online) {
    try {
      const data = await api.getModels();
      if (data.models?.length > 0) return data.models;
    } catch {}
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
    } catch {}
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

// Chat — prioriza server (que busca dados do MongoDB), fallback direto
export async function callGemini(messages, model) {
  const key = localStorage.getItem('angler_gemini_key');
  if (!key) throw new Error('Configure a chave do Gemini nas Configurações.');

  const useModel = model || 'gemini-2.0-flash';

  // Tenta server proxy primeiro (server busca dados frescos do MongoDB)
  const online = await checkServer();
  if (online) {
    try {
      // Server ignora o system message do frontend e constrói o próprio com dados do MongoDB
      const reply = await api.chat(messages, useModel);
      return reply.reply || '';
    } catch (err) {
      throw err;
    }
  }

  // Fallback offline: usar contexto local (localStorage)
  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = { contents };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

  // Chamar direto só quando server offline
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${key}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const errMsg = err.error?.message || `Erro ${resp.status}`;
    if (errMsg.includes('quota') || errMsg.includes('429') || resp.status === 429) {
      throw new Error('Limite diário atingido. Aguarde até amanhã ou ative o faturamento no Google AI Studio para mais requisições.');
    }
    if (errMsg.includes('not found') || resp.status === 404) throw new Error('Modelo não disponível. Atualize a lista.');
    if (errMsg.includes('high demand') || resp.status === 503) throw new Error('Muita gente usando. Espere 1 minuto.');
    if (resp.status === 403) throw new Error('Acesso negado. Verifique se a API Generative Language está ativada no projeto do Google Cloud.');
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