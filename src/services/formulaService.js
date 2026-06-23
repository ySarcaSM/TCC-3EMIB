const STORAGE_KEY = 'angler_formulas';

function load() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}

function save(formulas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formulas));
}

function getAll() {
  let f = load();
  if (!f) { f = []; save(f); }
  return f;
}

function extractVariables(latex, constantes = []) {
  if (!latex) return [];
  const cleaned = latex.replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
  const words = cleaned.split(/\s+/).filter(w => w.length >= 1 && /^[a-zA-Z]+$/.test(w));
  const ignore = new Set(['d', 'e', 'x', 'dx', 'dt', 'dy', 'dz']);
  const constNames = new Set((constantes || []).map(c => c.nome.toLowerCase()));
  return [...new Set(words.filter(v => !ignore.has(v) && !constNames.has(v.toLowerCase())))].sort();
}

export function getAllFormulas() { return getAll(); }
export function getFormulaById(id) { return getAll().find(f => f.id === id) || null; }

export function createFormula({ nome, latex, descricao, constantes }) {
  const formulas = getAll();
  const consts = constantes || [];
  const f = {
    id: 'f' + Date.now(),
    nome: nome || 'Sem nome',
    latex: latex || '',
    descricao: descricao || '',
    variaveis: extractVariables(latex, consts),
    constantes: consts,
    criadoEm: new Date().toISOString().split('T')[0],
    favorito: false,
  };
  formulas.push(f);
  save(formulas);
  return f;
}

export function updateFormula(id, updates) {
  const formulas = getAll();
  const idx = formulas.findIndex(f => f.id === id);
  if (idx === -1) return null;
  const merged = { ...formulas[idx], ...updates };
  if (updates.latex !== undefined || updates.constantes !== undefined) {
    updates.variaveis = extractVariables(merged.latex, merged.constantes);
  }
  formulas[idx] = { ...formulas[idx], ...updates };
  save(formulas);
  return formulas[idx];
}

export function deleteFormula(id) {
  save(getAll().filter(f => f.id !== id));
  return true;
}