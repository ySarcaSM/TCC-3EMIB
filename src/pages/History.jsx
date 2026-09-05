import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  logInOutline, logOutOutline, personAddOutline, keyOutline,
  documentTextOutline, cubeOutline, peopleOutline, flaskOutline,
  trashOutline, createOutline, timeOutline, filterOutline,
  sunnyOutline, moonOutline, flashOutline,
} from 'ionicons/icons';
import { getFullHistory, clearHistory } from '../services/historyService';

// Map de ícones
const ICON_MAP = {
  logInOutline, logOutOutline, personAddOutline, keyOutline,
  documentTextOutline, cubeOutline, peopleOutline, flaskOutline,
  trashOutline, createOutline, timeOutline, filterOutline,
  sunnyOutline, moonOutline, flashOutline,
};

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'login', label: 'Login', match: ['Login', 'Logout', 'Conta'] },
  { key: 'client', label: 'Clientes', match: ['Cliente'] },
  { key: 'product', label: 'Produtos', match: ['Produto'] },
  { key: 'budget', label: 'Orçamentos', match: ['Orçamento'] },
  { key: 'formula', label: 'Fórmulas', match: ['Fórmula', 'fórmula'] },
  { key: 'theme', label: 'Tema', match: ['Tema'] },
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

export default function History() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setHistory(getFullHistory());
  }, []);

  const handleClear = () => {
    if (confirm('Limpar todo o histórico?')) {
      clearHistory();
      setHistory([]);
    }
  };

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
          <IonIcon icon={timeOutline} style={{ fontSize: 31, color: 'var(--primary)' }} />
          <h2 style={{ fontSize: 27, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Histórico de Atividades</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <IonIcon icon={filterOutline} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 27, color: 'var(--muted)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{
                padding: '9px 12px 9px 34px', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 21, outline: 'none', width: 220,
              }}
            />
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleClear} style={{ fontSize: 19 }}>
            Limpar
          </button>
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
          <IonIcon icon={timeOutline} style={{ fontSize: 57 }} />
          <p>Nenhuma atividade encontrada.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div style={{
                fontSize: 25, fontWeight: 600, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.5px',
                marginBottom: 12, paddingLeft: 4,
              }}>
                {date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : date}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(item => {
                  const IconComp = ICON_MAP[item.icon] || flashOutline;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 18px', background: 'var(--card)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      transition: 'border-color .15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = item.color + '40'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: item.color + '15', color: item.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <IonIcon icon={IconComp} style={{ fontSize: 25 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 27, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                          {item.action}
                        </div>
                        <div style={{ fontSize: 25, color: 'var(--muted)' }}>
                          {item.detail}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 19, color: 'var(--muted)', fontFamily: "'DM Mono', monospace",
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      <div style={{
        textAlign: 'center', marginTop: 24, padding: 18,
        fontSize: 25, color: 'var(--muted)',
      }}>
        {filtered.length} {filtered.length === 1 ? 'atividade' : 'atividades'} {filter !== 'all' ? '(filtrado)' : ''}
      </div>
    </div>
  );
}
