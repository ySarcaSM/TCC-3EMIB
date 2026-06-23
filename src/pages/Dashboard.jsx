import React from 'react';
import { getDB, fc } from '../services/db';
import { getAllFormulas } from '../services/formulaService';

const KPI = ({ cls, icon, val, label }) => (
  <div className="kpi">
    <div className="kpi-head">
      <div className={`kpi-icon ${cls}`}>{icon}</div>
    </div>
    <div className="kpi-val">{val}</div>
    <div className="kpi-label">{label}</div>
  </div>
);

export default function Dashboard() {
  const db = getDB();
  const formulas = getAllFormulas();

  const totalClientes = db.clientes.length;
  const totalOrcamentos = db.orcamentos.length;
  const orcAprovados = db.orcamentos.filter((o) => o.status === 'Aprovado');
  const orcPendentes = db.orcamentos.filter((o) => o.status === 'Rascunho' || o.status === 'Enviado').length;
  const receita = orcAprovados.reduce((a, o) => a + (o.valor || 0), 0);
  const totalProdutos = db.produtos.length;
  const totalFormulas = formulas.length;
  const totalVariaveis = formulas.reduce((a, f) => a + (f.variaveis?.length || 0), 0);
  const totalConstantes = formulas.reduce((a, f) => a + (f.constantes?.length || 0), 0);

  const monthMap = {};
  orcAprovados.filter(o => o.dataAprovacao).forEach(o => {
    const m = o.dataAprovacao.slice(0, 7);
    monthMap[m] = (monthMap[m] || 0) + (o.valor || 0);
  });
  const sortedMonths = Object.keys(monthMap).sort().slice(-6);
  const monthLabels = sortedMonths.map(m => ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(m.split('-')[1]) - 1]);
  const monthVals = sortedMonths.map(m => monthMap[m]);
  const maxVal = Math.max(...monthVals, 1);

  const statuses = ['Rascunho', 'Enviado', 'Aprovado', 'Rejeitado', 'Expirado'];
  const byStatus = statuses.map(s => ({ s, count: db.orcamentos.filter(o => o.status === s).length }));
  const dotColor = { Rascunho: 'var(--muted)', Enviado: 'var(--blue)', Aprovado: 'var(--green)', Rejeitado: 'var(--red)', Expirado: 'var(--muted)' };

  const formulaSizes = [
    { label: 'Sem variáveis', count: formulas.filter(f => (f.variaveis?.length || 0) === 0).length },
    { label: '1 variável', count: formulas.filter(f => f.variaveis?.length === 1).length },
    { label: '2 variáveis', count: formulas.filter(f => f.variaveis?.length === 2).length },
    { label: '3+ variáveis', count: formulas.filter(f => (f.variaveis?.length || 0) >= 3).length },
  ];

  return (
    <div>
      <div className="dash-kpis">
        <KPI cls="b" val={totalClientes} label="Total de Clientes" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
        <KPI cls="y" val={totalOrcamentos} label="Total de Orçamentos" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>} />
        <KPI cls="g" val={fc(receita)} label="Receita (Aprovados)" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
        <KPI cls="r" val={totalFormulas} label="Fórmulas Criadas" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} />
      </div>

      <div className="dash-kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <KPI cls="b" val={totalProdutos} label="Produtos Cadastrados" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>} />
        <KPI cls="g" val={totalVariaveis} label="Variáveis Detectadas" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>} />
        <KPI cls="y" val={totalConstantes} label="Constantes Definidas" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>} />
        <KPI cls="b" val={orcPendentes} label="Orçamentos Pendentes" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Receita por Mês (Orçamentos Aprovados)</h3>
          {monthVals.length > 0 ? (
            <>
              <div className="chart-bars">
                {monthVals.map((v, i) => (
                  <div key={i} className="chart-bar" style={{ height: Math.max((v / maxVal) * 140, 4) }} data-val={fc(v)} />
                ))}
              </div>
              <div className="chart-labels">{monthLabels.map((m, i) => <span key={i}>{m}</span>)}</div>
            </>
          ) : <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>Sem dados de receita</p>}
        </div>
        <div className="dash-card">
          <h3>Fórmulas por Variáveis</h3>
          <div className="status-list">
            {formulaSizes.map(p => (
              <div key={p.label} className="status-item">
                <div className="status-item-left"><span className="status-item-name">{p.label}</span></div>
                <span className="status-item-count">{p.count}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>Orçamentos por Status</h3>
            <div className="status-list">
              {byStatus.map(p => (
                <div key={p.s} className="status-item">
                  <div className="status-item-left">
                    <div className="status-dot" style={{ background: dotColor[p.s] }} />
                    <span className="status-item-name">{p.s}</span>
                  </div>
                  <span className="status-item-count">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}