import { api } from './api';

let db = {
  clientes: [],
  produtos: [],
  orcamentos: [],
};

let serverAvailable = false;

// Testar se server está disponível
async function checkServer() {
  try {
    const resp = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
    serverAvailable = resp.ok;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

export function getDB() {
  return db;
}

export async function loadDB() {
  // Resetar para estado vazio
  db = { clientes: [], produtos: [], orcamentos: [] };

  // Carregar do localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('anglerDB'));
    if (saved) db = { ...db, ...saved };
  } catch {}

  // Tenta carregar do server
  const online = await checkServer();
  if (online) {
    try {
      const [clients, products, budgets] = await Promise.all([
        api.getData('clients/info'),
        api.getData('products/info'),
        api.getData('budgets/info'),
      ]);
      // Só sobrescreve se o server retornou dados
      if (clients?.clientes) db.clientes = clients.clientes;
      if (products?.produtos) db.produtos = products.produtos;
      if (budgets?.orcamentos) db.orcamentos = budgets.orcamentos;

      localStorage.setItem('anglerDB', JSON.stringify(db));
    } catch {}
  }
}

export function saveDB() {
  // Salva no localStorage imediatamente
  localStorage.setItem('anglerDB', JSON.stringify(db));

  // Se server disponível, sincroniza em background
  if (serverAvailable) {
    Promise.all([
      api.saveData('clients/info', { clientes: db.clientes }),
      api.saveData('products/info', { produtos: db.produtos }),
      api.saveData('budgets/info', { orcamentos: db.orcamentos }),
    ]).catch(() => {});
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function fd(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function fc(value) {
  if (value == null) return 'R$ 0,00';
  return 'R$ ' + Number(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}