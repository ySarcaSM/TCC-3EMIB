const KEYS_STORAGE = 'angler_gemini_key';
const MODELS_CACHE = 'angler_gemini_models';
const MODEL_STORAGE = 'angler_gemini_model';

/* ─── Friendly errors ─── */
function friendlyError(err) {
  const msg = err.message || String(err);

  if (msg.includes('quota') || msg.includes('rate') || msg.includes('429')) {
    return 'Você usou muitas perguntas seguidas. Aguarde 1 minuto e tente de novo. Se estiver no plano gratuito, o limite diário pode ter acabado.';
  }
  if (msg.includes('401') || msg.includes('invalid') || msg.includes('API key')) {
    return 'Sua chave de API parece estar errada. Copie novamente do site do Google AI Studio e cole aqui.';
  }
  if (msg.includes('not found') || msg.includes('not supported') || msg.includes('404')) {
    return 'O modelo escolhido não está mais disponível. Clique no botão de atualizar modelos para ver os disponíveis.';
  }
  if (msg.includes('high demand') || msg.includes('overloaded') || msg.includes('503') || msg.includes('529')) {
    return 'O Gemini está com muita gente usando agora. Espere 1 minutinho e tente de novo.';
  }
  if (msg.includes('billing') || msg.includes('payment') || msg.includes('plan')) {
    return 'Seu plano precisa de atenção. Acesse o Google AI Studio para verificar.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NETWORK')) {
    return 'Não consegui conectar com o Google. Verifique sua internet e tente novamente.';
  }
  return 'Algo deu errado. Tente novamente em alguns instantes. Se o problema continuar, gere uma nova chave no Google AI Studio.';
}

/* ─── Key management ─── */
export function getKey() {
  return localStorage.getItem(KEYS_STORAGE) || '';
}
export function saveKey(key) {
  localStorage.setItem(KEYS_STORAGE, key);
}

/* ─── Model management ─── */
export function getSelectedModel() {
  return localStorage.getItem(MODEL_STORAGE) || 'gemini-2.0-flash';
}
export function setSelectedModel(model) {
  localStorage.setItem(MODEL_STORAGE, model);
}

/* ─── Fetch available models ─── */
export async function fetchModels() {
  const key = getKey();
  if (!key?.trim()) return null;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!r.ok) return null;
    const data = await r.json();
    const genModels = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .sort();
    if (genModels.length > 0) {
      localStorage.setItem(MODELS_CACHE, JSON.stringify({ models: genModels, ts: Date.now() }));
      return genModels;
    }
    return null;
  } catch {
    return null;
  }
}

export function getCachedModels() {
  try {
    const cache = JSON.parse(localStorage.getItem(MODELS_CACHE));
    if (cache && Date.now() - cache.ts < 1000 * 60 * 60) return cache.models;
  } catch {}
  return null;
}

export async function loadModels() {
  const cached = getCachedModels();
  if (cached) return cached;
  const fresh = await fetchModels();
  if (fresh) return fresh;
  return ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
}

/* ─── Test key ─── */
export async function testKey(key) {
  if (!key?.trim()) return { ok: false, msg: 'Digite a chave de API primeiro.' };
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!r.ok) {
      if (r.status === 400) return { ok: false, msg: 'Chave inválida. Verifique se copiou corretamente do Google AI Studio.' };
      return { ok: false, msg: `Erro ${r.status}. Tente novamente.` };
    }
    const data = await r.json();
    const count = data.models?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))?.length || 0;
    return { ok: true, msg: `Tudo certo! ${count} modelos disponíveis.` };
  } catch {
    return { ok: false, msg: 'Não consegui conectar. Verifique sua internet.' };
  }
}

/* ─── Call Gemini ─── */
export async function callGemini(messages, modelOverride) {
  const key = getKey();
  if (!key) throw new Error('Chave de API não configurada. Abra as Configurações e cole sua chave do Google AI Studio.');

  const model = modelOverride || getSelectedModel();

  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = { contents };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ${resp.status}`);
    }
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}