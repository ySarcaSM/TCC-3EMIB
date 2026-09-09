// ═══════════════════════════════════════════════════════════
// src/services/db.js — CORRIGIDO: sincronização com MongoDB
// ═══════════════════════════════════════════════════════════

import { api } from './api';

let db = {
  clientes: [],
  produtos: [],
  orcamentos: [],
};

export function getDB() {
  return db;
}

export async function loadDB() {
  // Resetar para estado vazio
  db = { clientes: [], produtos: [], orcamentos: [] };

  // Carregar do localStorage como fallback
  try {
    const saved = JSON.parse(localStorage.getItem('anglerDB'));
    if (saved) db = { ...db, ...saved };
  } catch {}

  // Tenta carregar do server (sempre tenta, sem flag)
  try {
    const [clients, products, budgets] = await Promise.all([
      api.getData('clients/info'),
      api.getData('products/info'),
      api.getData('budgets/info'),
    ]);
    if (clients?.clientes) db.clientes = clients.clientes;
    if (products?.produtos) db.produtos = products.produtos;
    if (budgets?.orcamentos) db.orcamentos = budgets.orcamentos;
    localStorage.setItem('anglerDB', JSON.stringify(db));
  } catch {
    // Server indisponível — localStorage já foi carregado acima
  }
}

export function saveDB() {
  // Salva no localStorage imediatamente (sempre funciona)
  localStorage.setItem('anglerDB', JSON.stringify(db));

  // Tenta sincronizar com server (sempre tenta, sem checar flag)
  Promise.all([
    api.saveData('clients/info', { clientes: db.clientes }),
    api.saveData('products/info', { produtos: db.produtos }),
    api.saveData('budgets/info', { orcamentos: db.orcamentos }),
  ]).catch(() => {});
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ✅ BUG #5 CORRIGIDO: validação de formato de data
export function fd(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function fc(value) {
  if (value == null) return 'R$ 0,00';
  return 'R$ ' + Number(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
