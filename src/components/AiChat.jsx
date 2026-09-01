import React, { useState, useRef } from 'react';
import { getDB, saveDB, uid, fc } from '../services/db';

const RESPONSES = {
  'cadastrar cliente': {
    msg: 'Para cadastrar um cliente, vou precisar de: <strong>Nome</strong>, <strong>E-mail</strong>, <strong>Telefone</strong>, <strong>CPF/CNPJ</strong> e Tipo (PF/PJ/ME). Quer que eu abra o formulário?',
    chips: ['Abrir formulário de cliente', 'Cadastrar com dados fictícios'],
  },
  'cadastrar produto': {
    msg: 'Para cadastrar um produto, preciso de: <strong>Nome</strong>, <strong>Descrição</strong>, <strong>Categoria</strong>, <strong>Valor</strong> e <strong>Estoque</strong>. Posso abrir o formulário?',
    chips: ['Abrir formulário de produto', 'Cadastrar caneta personalizada'],
  },
  'criar orçamento': {
    msg: 'Vamos criar um orçamento! Preciso do <strong>Cliente</strong>, <strong>Descrição</strong>, <strong>Itens</strong> e <strong>Validade</strong>.',
    chips: ['Abrir formulário de orçamento', 'Criar para Beta Corp'],
  },
  'ver resumo': {
    msg: () => {
      const db = getDB();
      return `📊 <strong>Resumo:</strong><br>• <strong>${db.clientes.length}</strong> clientes<br>• <strong>${db.produtos.length}</strong> produtos<br>• <strong>${db.orcamentos.length}</strong> orçamentos (${db.orcamentos.filter(o => o.status === 'Aprovado').length} aprovados)`;
    },
    chips: ['Cadastrar cliente', 'Criar orçamento'],
  },
  'abrir formulário de cliente': { action: 'openCliente', msg: 'Abrindo formulário de cliente...' },
  'abrir formulário de produto': { action: 'openProduto', msg: 'Abrindo formulário de produto...' },
  'abrir formulário de orçamento': { action: 'openOrcamento', msg: 'Abrindo formulário de orçamento...' },
  'cadastrar com dados fictícios': {
    action: 'createFakeClient',
    msg: () => {
      const db = getDB();
      const n = db.clientes[db.clientes.length - 1]?.nome || 'Novo Cliente';
      return `✅ Cliente <strong>${n}</strong> cadastrado com sucesso!`;
    },
  },
  'cadastrar caneta personalizada': {
    action: 'createCaneta',
    msg: '✅ Produto <strong>"Caneta Personalizada"</strong> cadastrado!<br>• Categoria: Brinde<br>• Valor: R$ 8,50<br>• Estoque: 500',
  },
  'criar para beta corp': {
    action: 'createBetaOrc',
    msg: () => {
      const db = getDB();
      return `✅ Orçamento criado para <strong>Beta Corp S.A.</strong><br>• Código: ORC-${String(db.orcamentos.length).padStart(3, '0')}<br>• Total: R$ 25.000,00`;
    },
  },
};

export default function AiChat({ onNavigate }) {
  const [msgs, setMsgs] = useState([
    { role: 'bot', text: 'Olá! 👋 Sou o assistente do Angler. Posso cadastrar <strong>clientes</strong>, <strong>produtos</strong> e <strong>orçamentos</strong>.<div class="ai-chips"><span class="ai-chip" data-cmd="Cadastrar cliente">👤 Cadastrar cliente</span><span class="ai-chip" data-cmd="Cadastrar produto">📦 Cadastrar produto</span><span class="ai-chip" data-cmd="Criar orçamento">📄 Criar orçamento</span><span class="ai-chip" data-cmd="Ver resumo">📊 Ver resumo</span></div>' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);

  const scroll = () => setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 50);

  const runAction = (key) => {
    const db = getDB();
    if (key === 'openCliente') { onNavigate('clientes'); return; }
    if (key === 'openProduto') { onNavigate('produtos'); return; }
    if (key === 'openOrcamento') { onNavigate('orcamentos'); return; }
    if (key === 'createFakeClient') {
      const names = ['Tech Solutions Ltda', 'Inova Digital', 'Max Promoções'];
      const n = names[Math.floor(Math.random() * names.length)];
      db.clientes.push({ id: uid(), nome: n, email: n.toLowerCase().replace(/\s/g, '.') + '@email.com', telefone: '(11) 9' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000), documento: '00.000.000/0001-' + Math.floor(10 + Math.random() * 90), tipo: 'PJ', status: 'Ativo', dataCadastro: new Date().toISOString().slice(0, 10), endereco: 'Rua Exemplo, ' + Math.floor(1 + Math.random() * 999) });
      saveDB();
    }
    if (key === 'createCaneta') {
      db.produtos.push({ id: uid(), nome: 'Caneta Personalizada', descricao: 'Caneta esferográfica com logotipo', categoria: 'Brinde', valor: 8.50, estoque: 500, status: 'Ativo' });
      saveDB();
    }
    if (key === 'createBetaOrc') {
      const orc = { id: uid(), codigo: 'ORC-' + String(db.orcamentos.length + 1).padStart(3, '0'), clienteId: 'c2', descricao: 'Projeto de integração — Beta Corp', status: 'Rascunho', data: new Date().toISOString().slice(0, 10), validade: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), dataAprovacao: null, itens: [{ desc: 'Análise de requisitos', qtd: 1, valor: 5000 }, { desc: 'Desenvolvimento', qtd: 1, valor: 15000 }, { desc: 'Testes e deploy', qtd: 1, valor: 5000 }] };
      orc.valor = orc.itens.reduce((a, i) => a + i.qtd * i.valor, 0);
      db.orcamentos.push(orc);
      saveDB();
    }
  };

  const process = (text) => {
    setTyping(true);
    const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let matched = null;
    for (const key in RESPONSES) {
      if (lower.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) { matched = RESPONSES[key]; break; }
    }
    setTimeout(() => {
      setTyping(false);
      let botText;
      if (matched) {
        botText = typeof matched.msg === 'function' ? matched.msg() : matched.msg;
        if (matched.action) runAction(matched.action);
        if (matched.chips) botText += '<div class="ai-chips">' + matched.chips.map(c => `<span class="ai-chip" data-cmd="${c}">${c}</span>`).join('') + '</div>';
      } else {
        botText = 'Não entendi. Tente: <span class="ai-cmd" data-cmd="Cadastrar cliente">cadastrar cliente</span>, <span class="ai-cmd" data-cmd="Cadastrar produto">cadastrar produto</span> ou <span class="ai-cmd" data-cmd="Criar orçamento">criar orçamento</span>.';
      }
      setMsgs(prev => [...prev, { role: 'bot', text: botText }]);
      scroll();
    }, 800 + Math.random() * 800);
  };

  const send = (text) => {
    if (!text?.trim()) return;
    setMsgs(prev => [...prev, { role: 'user', text }]);
    scroll();
    process(text);
  };

  const handleClick = (e) => {
    const cmd = e.target.dataset?.cmd;
    if (cmd) send(cmd);
  };

  return (
    <div className="ai-chat-card">
      <div className="ai-chat-header">
        <div className="ai-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" /><circle cx="12" cy="7" r="1" fill="currentColor" /></svg>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Angler AI — Assistente</h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            <span className="ai-status-dot" />Online · Cadastre dados por aqui
          </p>
        </div>
      </div>
      <div className="ai-chat-body" ref={bodyRef} onClick={handleClick}>
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className="ai-msg-avatar">{m.role === 'bot' ? 'AI' : 'AD'}</div>
            <div className="ai-msg-bubble" dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        {typing && (
          <div className="ai-msg bot">
            <div className="ai-msg-avatar">AI</div>
            <div className="ai-msg-bubble"><div className="ai-typing"><span /><span /><span /></div></div>
          </div>
        )}
      </div>
      <div className="ai-chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { send(input); setInput(''); } }}
          placeholder="Ex: Cadastrar cliente Empresa XYZ..."
        />
        <button className="ai-send-btn" onClick={() => { send(input); setInput(''); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" /></svg>
        </button>
      </div>
    </div>
  );
}