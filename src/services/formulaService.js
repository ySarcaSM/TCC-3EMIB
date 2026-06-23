import { api } from './api';

let formulas = [];
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

export async function loadFormulasFromServer() {
  // LocalStorage primeiro
  try { formulas = JSON.parse(localStorage.getItem('angler_formulas')) || []; } catch { formulas = []; }

  // Tenta server
  const online = await checkServer();
  if (online) {
    try {
      const data = await api.getData('formulas/info');
      if (data?.formulas) formulas = data.formulas;
      localStorage.setItem('angler_formulas', JSON.stringify(formulas));
    } catch {}
  }
  return formulas;
}

function saveFormulas() {
  localStorage.setItem('angler_formulas', JSON.stringify(formulas));
  if (serverAvailable) {
    api.saveData('formulas/info', { formulas }).catch(() => {});
  }
}

export function getAllFormulas() { return formulas; }
export function getFormulaById(id) { return formulas.find(f => f.id === id) || null; }

export function createFormula({ nome, latex, descricao, constantes }) {
  const consts = constantes || [];
  const cleaned = (latex || '').replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
  const words = cleaned.split(/\s+/).filter(w => w.length >= 1 && /^[a-zA-Z]+$/.test(w));
  const ignore = new Set(['d', 'e', 'x', 'dx', 'dt', 'dy', 'dz']);
  const constNames = new Set(consts.map(c => c.nome.toLowerCase()));
  const variaveis = [...new Set(words.filter(v => !ignore.has(v) && !constNames.has(v.toLowerCase())))].sort();

  const f = {
    id: 'f' + Date.now(),
    nome: nome || 'Sem nome',
    latex: latex || '',
    descricao: descricao || '',
    variaveis,
    constantes: consts,
    criadoEm: new Date().toISOString().split('T')[0],
    favorito: false,
  };
  formulas.push(f);
  saveFormulas();
  return f;
}

export function updateFormula(id, updates) {
  const idx = formulas.findIndex(f => f.id === id);
  if (idx === -1) return null;
  formulas[idx] = { ...formulas[idx], ...updates };
  saveFormulas();
  return formulas[idx];
}

export function deleteFormula(id) {
  formulas = formulas.filter(f => f.id !== id);
  saveFormulas();
}