const STORAGE_KEY = 'mathforge_formulas';
const VERSION_KEY = 'mathforge_version';
const CURRENT_VERSION = '2.0';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // fallback
  }
  return null;
}

function saveToStorage(formulas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formulas));
}

function getFormulas() {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  }

  let formulas = loadFromStorage();
  if (!formulas) {
    formulas = [];
    saveToStorage(formulas);
  }
  return formulas;
}

function extractVariables(latex) {
  if (!latex) return [];
  const cleaned = latex.replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
  const words = cleaned.split(/\s+/).filter((w) => w.length === 1 && /[a-zA-Z]/.test(w));
  const ignore = new Set(['d', 'e', 'x']);
  return [...new Set(words.filter((v) => !ignore.has(v)))].sort();
}

export function getAllFormulas() {
  return getFormulas();
}

export function getFormulaById(id) {
  return getFormulas().find((f) => f.id === id) || null;
}

export function createFormula({ nome, latex, descricao, constantes }) {
  const formulas = getFormulas();
  const newFormula = {
    id: 'f' + Date.now(),
    nome: nome || 'Sem nome',
    latex: latex || '',
    descricao: descricao || '',
    variaveis: extractVariables(latex),
    constantes: constantes || [],
    criadoEm: new Date().toISOString().split('T')[0],
    favorito: false,
  };
  formulas.push(newFormula);
  saveToStorage(formulas);
  return newFormula;
}

export function updateFormula(id, updates) {
  const formulas = getFormulas();
  const index = formulas.findIndex((f) => f.id === id);
  if (index === -1) return null;

  if (updates.latex !== undefined) {
    updates.variaveis = extractVariables(updates.latex);
  }

  formulas[index] = { ...formulas[index], ...updates };
  saveToStorage(formulas);
  return formulas[index];
}

export function deleteFormula(id) {
  const formulas = getFormulas().filter((f) => f.id !== id);
  saveToStorage(formulas);
  return true;
}