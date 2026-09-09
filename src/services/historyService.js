// ═══════════════════════════════════════════════════════════
// src/services/historyService.js — CORRIGIDO: sincronização com MongoDB
// ═══════════════════════════════════════════════════════════

import { api } from './api';

const STORAGE_KEY = 'angler_history';
const MAX_ENTRIES = 200;

let historyLoaded = false;
let entries = [];

function getHistory() {
  if (!historyLoaded) {
    try {
      entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      entries = [];
    }
    historyLoaded = true;
  }
  return entries;
}

function save() {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  entries = trimmed;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  // Sincroniza com server
  api.saveData('history/info', { history: trimmed }).catch(() => {});
}

/** Carrega histórico do server (chamar no login) */
export async function loadHistoryFromServer() {
  try {
    entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    entries = [];
  }
  try {
    const data = await api.getData('history/info');
    if (data?.history) {
      entries = data.history;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  } catch {}
  historyLoaded = true;
  return entries;
}

/**
 * Registra uma ação no histórico
 */
export function logAction(action, detail, icon = 'flashOutline', color = '#3b82f6') {
  getHistory();
  entries.unshift({
    id: `h${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    detail,
    icon,
    color,
    timestamp: new Date().toISOString(),
  });
  save();
}

/**
 * Retorna todo o histórico
 */
export function getFullHistory() {
  return getHistory().map(entry => ({
    ...entry,
    timestamp: new Date(entry.timestamp),
  }));
}

/**
 * Limpa o histórico
 */
export function clearHistory() {
  entries = [];
  localStorage.removeItem(STORAGE_KEY);
  api.saveData('history/info', { history: [] }).catch(() => {});
}

// ── Atalhos para ações comuns ──

export const HistoryActions = {
  login: (username) => logAction(
    'Login realizado', `Usuário: ${username}`,
    'logInOutline', '#3b82f6'
  ),
  logout: () => logAction(
    'Logout realizado', 'Sessão encerrada',
    'logOutOutline', '#707a8a'
  ),
  register: (username) => logAction(
    'Conta criada', `Usuário: ${username}`,
    'personAddOutline', '#0ecb81'
  ),
  clientCreated: (name) => logAction(
    'Cliente cadastrado', name,
    'peopleOutline', '#0ecb81'
  ),
  clientUpdated: (name) => logAction(
    'Cliente atualizado', name,
    'peopleOutline', '#3b82f6'
  ),
  clientDeleted: (name) => logAction(
    'Cliente removido', name,
    'peopleOutline', '#f6465d'
  ),
  productCreated: (name) => logAction(
    'Produto cadastrado', name,
    'cubeOutline', '#0ecb81'
  ),
  productUpdated: (name) => logAction(
    'Produto atualizado', name,
    'cubeOutline', '#3b82f6'
  ),
  productDeleted: (name) => logAction(
    'Produto removido', name,
    'cubeOutline', '#f6465d'
  ),
  budgetCreated: (id, value) => logAction(
    'Orçamento criado', `Pedido #${id} — ${value}`,
    'documentTextOutline', '#fcd535'
  ),
  budgetUpdated: (id) => logAction(
    'Orçamento atualizado', `Pedido #${id}`,
    'documentTextOutline', '#3b82f6'
  ),
  budgetApproved: (id, value) => logAction(
    'Orçamento aprovado', `Pedido #${id} — ${value}`,
    'documentTextOutline', '#0ecb81'
  ),
  budgetDeleted: (id) => logAction(
    'Orçamento removido', `Pedido #${id}`,
    'documentTextOutline', '#f6465d'
  ),
  formulaCreated: (name) => logAction(
    'Fórmula criada', name,
    'flaskOutline', '#f97316'
  ),
  formulaUpdated: (name) => logAction(
    'Fórmula editada', name,
    'flaskOutline', '#3b82f6'
  ),
  formulaDeleted: (name) => logAction(
    'Fórmula removida', name,
    'flaskOutline', '#f6465d'
  ),
  themeChanged: (isLight) => logAction(
    'Tema alterado', isLight ? 'Tema claro' : 'Tema escuro',
    isLight ? 'sunnyOutline' : 'moonOutline', '#a855f7'
  ),
};
