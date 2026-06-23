const DB_KEY = 'angler_db';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fc(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fd(d) {
  if (!d) return '—';
  const p = d.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function seedData() {
  return {
    clientes: [
      { id: 'c1', nome: 'Empresa Alpha Ltda', email: 'contato@alpha.com', telefone: '(11) 99999-1111', documento: '12.345.678/0001-90', tipo: 'PJ', status: 'Ativo', dataCadastro: '2024-01-15', endereco: 'Rua Augusta, 1200 - São Paulo' },
      { id: 'c2', nome: 'Beta Corp S.A.', email: 'admin@betacorp.com', telefone: '(21) 98888-2222', documento: '23.456.789/0001-01', tipo: 'PJ', status: 'Ativo', dataCadastro: '2024-02-20', endereco: 'Av. Atlântica, 500 - Rio de Janeiro' },
      { id: 'c3', nome: 'Gamma Soluções', email: 'gamma@email.com', telefone: '(31) 97777-3333', documento: '34.567.890/0001-12', tipo: 'PJ', status: 'Ativo', dataCadastro: '2024-03-10', endereco: 'Rua da Bahia, 800 - Belo Horizonte' },
      { id: 'c4', nome: 'Delta Tech ME', email: 'delta@tech.com', telefone: '(41) 96666-4444', documento: '45.678.901/0001-23', tipo: 'ME', status: 'Inativo', dataCadastro: '2024-01-28', endereco: 'Rua XV de Novembro, 300 - Curitiba' },
      { id: 'c5', nome: 'Omega Digital', email: 'hello@omega.digital', telefone: '(51) 95555-5555', documento: '56.789.012/0001-34', tipo: 'PJ', status: 'Ativo', dataCadastro: '2024-04-05', endereco: 'Av. Borges de Medeiros, 150 - Porto Alegre' },
      { id: 'c6', nome: 'Carla Mendes', email: 'carla.mendes@email.com', telefone: '(11) 94444-6666', documento: '123.456.789-00', tipo: 'PF', status: 'Ativo', dataCadastro: '2024-05-12', endereco: 'Rua Oscar Freire, 900 - São Paulo' },
    ],
    produtos: [
      { id: 'p1', nome: 'Caneta Personalizada', descricao: 'Caneta esferográfica com logotipo', categoria: 'Brinde', valor: 8.50, estoque: 500, status: 'Ativo' },
      { id: 'p2', nome: 'Camiseta Corporativa', descricao: 'Camiseta 100% algodão com estampa', categoria: 'Brinde', valor: 35.00, estoque: 200, status: 'Ativo' },
      { id: 'p3', nome: 'Caneca Térmica', descricao: 'Caneca térmica 500ml personalizada', categoria: 'Brinde', valor: 42.00, estoque: 150, status: 'Ativo' },
      { id: 'p4', nome: 'Consultoria em TI', descricao: 'Hora de consultoria especializada', categoria: 'Serviço', valor: 250.00, estoque: 999, status: 'Ativo' },
      { id: 'p5', nome: 'Desenvolvimento Web', descricao: 'Site institucional completo', categoria: 'Serviço', valor: 8500.00, estoque: 999, status: 'Ativo' },
      { id: 'p6', nome: 'Licença Software Anual', descricao: 'Licença 12 meses', categoria: 'Software', valor: 1200.00, estoque: 999, status: 'Ativo' },
    ],
    orcamentos: [
      { id: 'o1', codigo: 'ORC-001', clienteId: 'c4', descricao: 'Redesign completo do portal', status: 'Enviado', data: '2024-06-01', validade: '2024-07-01', dataAprovacao: null, itens: [{ desc: 'UX Research', qtd: 1, valor: 5000 }, { desc: 'UI Design', qtd: 1, valor: 8000 }, { desc: 'Desenvolvimento', qtd: 1, valor: 9000 }] },
      { id: 'o2', codigo: 'ORC-002', clienteId: 'c2', descricao: 'Módulo de integração ERP', status: 'Aprovado', data: '2024-05-15', validade: '2024-06-15', dataAprovacao: '2024-05-20', itens: [{ desc: 'Análise de requisitos', qtd: 1, valor: 8000 }, { desc: 'Desenvolvimento', qtd: 1, valor: 20000 }, { desc: 'Testes e Deploy', qtd: 1, valor: 7000 }] },
      { id: 'o3', codigo: 'ORC-003', clienteId: 'c6', descricao: 'E-commerce completo', status: 'Rascunho', data: '2024-06-10', validade: '2024-07-10', dataAprovacao: null, itens: [{ desc: 'Loja virtual', qtd: 1, valor: 10000 }, { desc: 'Integração pagamentos', qtd: 1, valor: 5000 }, { desc: 'Painel admin', qtd: 1, valor: 3000 }] },
      { id: 'o5', codigo: 'ORC-005', clienteId: 'c1', descricao: 'Manutenção e suporte mensal', status: 'Aprovado', data: '2024-06-01', validade: '2024-06-30', dataAprovacao: '2024-06-03', itens: [{ desc: 'Suporte técnico', qtd: 1, valor: 2000 }, { desc: 'Atualizações', qtd: 1, valor: 1500 }] },
    ],
    notasFiscais: [
      { id: 'nf1', numero: 'NF-001', data: '2024-05-21', orcamentoId: 'o2', clienteId: 'c2', itens: [{ desc: 'Análise de requisitos', qtd: 1, valor: 8000 }, { desc: 'Desenvolvimento', qtd: 1, valor: 20000 }, { desc: 'Testes e Deploy', qtd: 1, valor: 7000 }], valorTotal: 35000, status: 'Emitida' },
      { id: 'nf2', numero: 'NF-002', data: '2024-06-04', orcamentoId: 'o5', clienteId: 'c1', itens: [{ desc: 'Suporte técnico', qtd: 1, valor: 2000 }, { desc: 'Atualizações', qtd: 1, valor: 1500 }], valorTotal: 3500, status: 'Emitida' },
    ],
  };
}

let _db = null;

export function loadDB() {
  try {
    const s = localStorage.getItem(DB_KEY);
    if (s) { _db = JSON.parse(s); }
    else { _db = seedData(); saveDB(); }
  } catch { _db = seedData(); saveDB(); }
  return _db;
}

export function getDB() {
  if (!_db) return loadDB();
  return _db;
}

export function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(_db));
}

export function resetDB() {
  _db = seedData();
  saveDB();
  return _db;
}

export { uid, fc, fd };