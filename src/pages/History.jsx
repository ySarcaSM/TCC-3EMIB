import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  logInOutline, logOutOutline, personAddOutline, keyOutline,
  documentTextOutline, cubeOutline, peopleOutline, flaskOutline,
  trashOutline, createOutline, timeOutline, filterOutline,
} from 'ionicons/icons';

// Histórico mockado — em produção viria do backend
const generateMockHistory = () => {
  const now = Date.now();
  const actions = [
    { icon: logInOutline, action: 'Login realizado', detail: 'Acesso via navegador', color: '#3b82f6' },
    { icon: peopleOutline, action: 'Cliente cadastrado', detail: 'North Bag Indústria', color: '#0ecb81' },
    { icon: documentTextOutline, action: 'Orçamento criado', detail: 'Pedido #1042 — R$ 12.450,00', color: '#fcd535' },
    { icon: cubeOutline, action: 'Produto atualizado', detail: 'Sacola TNT 30x40 — preço ajustado', color: '#a855f7' },
    { icon: flaskOutline, action: 'Fórmula editada', detail: 'Custo unitário TNT', color: '#f97316' },
    { icon: peopleOutline, action: 'Cliente atualizado', detail: 'Brinde Leve LTDA', color: '#3b82f6' },
    { icon: documentTextOutline, action: 'Orçamento aprovado', detail: 'Pedido #1038 — R$ 8.900,00', color: '#0ecb81' },
    { icon: createOutline, action: 'Perfil editado', detail: 'Nome atualizado', color: '#707a8a' },
    { icon: trashOutline, action: 'Produto removido', detail: 'Ecobag 20x25 (descontinuado)', color: '#f6465d' },
    { icon: logOutOutline, action: 'Logout realizado', detail: 'Sessão encerrada', color: '#707a8a' },
    { icon: logInOutline, action: 'Login realizado', detail: 'Acesso via navegador', color: '#3b82f6' },
    { icon: documentTextOutline, action: 'Orçamento enviado', detail: 'Pedido #1042 enviado por email', color: '#fcd535' },
    { icon: peopleOutline, action: 'Cliente cadastrado', detail: 'Célo Brindes', color: '#0ecb81' },
    { icon: flaskOutline, action: 'Fórmula criada', detail: 'Margem de lucro TNT', color: '#f97316' },
    { icon: cubeOutline, action: 'Produto cadastrado', detail: 'Mochila Promocional 40L', color: '#0ecb81' },
  ];

  return actions.map((a, i) => ({
    ...a,
    id: `h${i}`,
    timestamp: new Date(now - i * 3600000 * (1 + Math.random() * 3)),
  }));
};

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'login', label: 'Login', match: ['Login', 'Logout'] },
  { key: 'client', label: 'Clientes', match: ['Cliente'] },
  { key: 'product', label: 'Produtos', match: ['Produto'] },
  { key: 'budget', label: 'Orçamentos', match: ['Orçamento'] },
  { key: 'formula', label: 'Fórmulas', match: ['Fórmula'] },
];

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatFullDate(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Em produção, buscar do backend. Mock por enquanto.
    setHistory(generateMockHistory());
  }, []);

  const filtered = history.filter(item => {
    if (filter !== 'all') {
      const f = FILTERS.find(f => f.key === filter);
      if (f?.match && !f.match.some(m => item.action.includes(m))) return false;
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      return item.action.toLowerCase().includes(s) || item.detail.toLowerCase().includes(s);
    }
    return true;
  });

  // Agrupar por data
  const grouped = {};
  filtered.forEach(item => {
    const key = item.timestamp.toLocaleDateString('pt-BR');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IonIcon icon={timeOutline} style={{ fontSize: 24, color: 'var(--primary)' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Histórico de Atividades</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <IonIcon icon={filterOutline} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--muted)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{
                padding: '8px 12px 8px 34px', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15, outline: 'none', width: 200,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`tab-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty">
          <IonIcon icon={timeOutline} style={{ fontSize: 48 }} />
          <p>Nenhuma atividade encontrada.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.5px',
                marginBottom: 12, paddingLeft: 4,
              }}>
                {date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : date}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', background: 'var(--card)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    transition: 'border-color .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = item.color + '40'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: item.color + '15', color: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <IonIcon icon={item.icon} style={{ fontSize: 18 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {item.action}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                        {item.detail}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Mono', monospace",
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      <div style={{
        textAlign: 'center', marginTop: 24, padding: 16,
        fontSize: 14, color: 'var(--muted)',
      }}>
        {filtered.length} {filtered.length === 1 ? 'atividade' : 'atividades'} {filter !== 'all' ? '(filtrado)' : ''}
      </div>
    </div>
  );
}
