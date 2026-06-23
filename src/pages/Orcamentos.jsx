import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonAlert, IonContent, IonToast } from '@ionic/react';
import { closeOutline, calculatorOutline, informationCircleOutline } from 'ionicons/icons';
import { getDB, saveDB, uid, fd, fc } from '../services/db';
import { getAllFormulas } from '../services/formulaService';
import FormulaPreview from '../components/FormulaPreview';
import StatusBadge from '../components/StatusBadge';

/* ─── Helpers de cálculo ─── */
const IGNORE = new Set(['d','e','x','dx','dt','dy','dz']);

function getWords(text, constNames) {
  const cleaned = text.replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
  return [...new Set(cleaned.split(/\s+/).filter(w => w.length >= 1 && /^[a-zA-Z]+/.test(w)).filter(v => !IGNORE.has(v) && !constNames.has(v)))];
}

function getFormulaParts(formula) {
  const constNames = new Set((formula.constantes || []).map(c => c.nome));
  const allVars = (formula.variaveis || []).filter(v => !constNames.has(v));
  if (!formula.latex || !formula.latex.includes('=')) return { inputVars: allVars, resultVar: null };
  const eq = formula.latex.indexOf('=');
  const left = getWords(formula.latex.substring(0, eq), constNames);
  const right = getWords(formula.latex.substring(eq + 1), constNames);
  if (left.length === 1 && right.length >= 1) return { inputVars: right, resultVar: left[0] };
  if (right.length === 1 && left.length >= 1) return { inputVars: left, resultVar: right[0] };
  return { inputVars: allVars, resultVar: null };
}

function calcularFormula(formula, vars) {
  try {
    const constNames = new Set((formula.constantes || []).map(c => c.nome));
    let expr = formula.latex;
    if (expr.includes('=')) {
      const parts = expr.split('=');
      const lk = getWords(parts[0], constNames);
      const rk = getWords(parts[1], constNames);
      expr = lk.length > rk.length ? parts[0] : parts[parts.length - 1];
    }
    const allVals = {};
    (formula.constantes || []).forEach(c => { allVals[c.nome] = c.valor; });
    Object.entries(vars).forEach(([k, v]) => { if (v) allVals[k] = v; });
    const sorted = Object.entries(allVals).sort((a, b) => b[0].length - a[0].length);
    for (const [n, v] of sorted) {
      if (!v) continue;
      const r = new RegExp(`(?<![a-zA-Z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z])`, 'g');
      expr = expr.replace(r, `(${v})`);
    }
    expr = expr.replace(/\\left|\\right/g, '').replace(/\\text\{[^}]*\}/g, '0');
    expr = expr.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '(($1)/($2))');
    expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'Math.sqrt($1)');
    expr = expr.replace(/\^(\{[^}]+\}|\S+)/g, (_, e) => '**(' + e.replace(/[{}]/g, '') + ')');
    expr = expr.replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
    expr = expr.replace(/\\pi/g, `(${Math.PI})`).replace(/\\infty/g, 'Infinity');
    expr = expr.replace(/\\left\(/g, '(').replace(/\\right\)$$/g, ')');
    expr = expr.replace(/\\left$$/g, '[').replace(/\\right$$/g, ']');
    expr = expr.replace(/\\pm/g, '+').replace(/\\mp/g, '-');
    expr = expr.replace(/\\sin\(/g, 'Math.sin(').replace(/\\cos\(/g, 'Math.cos(').replace(/\\tan\(/g, 'Math.tan(');
    expr = expr.replace(/\\ln\(/g, 'Math.log(').replace(/\\log\(/g, 'Math.log10(').replace(/\\abs\(/g, 'Math.abs(');
    expr = expr.replace(/\\quad|\\,/g, ' ').replace(/\\\\/g, '');
    expr = expr.replace(/\\[a-zA-Z]+/g, '');
    expr = expr.replace(/[^0-9+\-*/().,%^ \n\r\t]/g, '');
    const r = Function('"use strict";return(' + expr + ')')();
    if (typeof r === 'number' && !isNaN(r) && isFinite(r)) return parseFloat(r.toPrecision(10));
    return null;
  } catch { return null; }
}

/* ─── Componente ─── */
export default function Orcamentos() {
  const [db, setDb] = useState(getDB);
  const [filter, setFilter] = useState('Todos');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [confirmNF, setConfirmNF] = useState(null);
  const [toast, setToast] = useState('');

  // Fórmula state
  const [formulaId, setFormulaId] = useState('');
  const [formulaVars, setFormulaVars] = useState({});
  const [formulaResult, setFormulaResult] = useState(null);

  const allFormulas = getAllFormulas();
  const selectedFormula = formulaId ? allFormulas.find(f => f.id === formulaId) : null;
  const parts = selectedFormula ? getFormulaParts(selectedFormula) : { inputVars: [], resultVar: null };

  const refresh = () => setDb({ ...getDB() });
  const getClientName = (id) => db.clientes.find(c => c.id === id)?.nome || '—';
  const getFormulaName = (id) => allFormulas.find(f => f.id === id)?.nome || '—';

  let list = db.orcamentos;
  if (filter !== 'Todos') list = list.filter(o => o.status === filter);

  /* ─── Abrir modais ─── */
  const openNew = () => {
    setForm({ codigo: 'ORC-' + String(db.orcamentos.length + 1).padStart(3, '0'), clienteId: db.clientes[0]?.id || '', descricao: '', status: 'Rascunho', validade: '', dataAprovacao: '' });
    setFormulaId(''); setFormulaVars({}); setFormulaResult(null);
    setModal({ mode: 'new' });
  };
  const openEdit = (id) => {
    const o = db.orcamentos.find(x => x.id === id);
    setForm({ ...o });
    setFormulaId(o.formulaId || '');
    setFormulaVars(o.formulaVars || {});
    setFormulaResult(o.valor || null);
    setModal({ mode: 'edit', id });
  };
  const openView = (id) => setModal({ mode: 'view', id });
  const close = () => setModal(null);

  /* ─── Selecionar fórmula ─── */
  const selectFormula = (id) => {
    setFormulaId(id);
    setFormulaVars({});
    setFormulaResult(null);
  };

  /* ─── Calcular ─── */
  const calcular = () => {
    if (!selectedFormula) { setToast('Selecione uma fórmula'); return; }
    const missing = parts.inputVars.filter(v => !formulaVars[v] && formulaVars[v] !== '0' && formulaVars[v] !== 0);
    if (missing.length) { setToast('Preencha: ' + missing.join(', ')); return; }
    const result = calcularFormula(selectedFormula, formulaVars);
    if (result !== null) {
      setFormulaResult(result);
      setToast('Cálculo realizado!');
    } else {
      setToast('Erro no cálculo — verifique os valores');
    }
  };

  /* ─── Salvar ─── */
  const save = () => {
    if (!form.descricao) { setToast('Preencha a descrição'); return; }
    const valor = formulaResult || 0;
    const data = {
      ...form,
      formulaId: formulaId || null,
      formulaVars: formulaId ? formulaVars : null,
      valor,
    };
    if (modal.mode === 'edit') Object.assign(db.orcamentos.find(x => x.id === modal.id), data);
    else { data.id = uid(); data.data = new Date().toISOString().slice(0, 10); db.orcamentos.push(data); }
    saveDB(); refresh(); close();
  };

  const del = (id) => { getDB().orcamentos = getDB().orcamentos.filter(o => o.id !== id); saveDB(); refresh(); setConfirmDel(null); };
  const approve = (id) => { const o = getDB().orcamentos.find(x => x.id === id); o.status = 'Aprovado'; o.dataAprovacao = new Date().toISOString().slice(0, 10); saveDB(); refresh(); setConfirmApprove(null); };

  const gerarNF = (orcId) => {
    const o = getDB().orcamentos.find(x => x.id === orcId);
    if (!o || o.status !== 'Aprovado') return;
    const existing = getDB().notasFiscais.find(n => n.orcamentoId === orcId && n.status === 'Emitida');
    if (existing) return;
    getDB().notasFiscais.push({
      id: uid(),
      numero: 'NF-' + String(getDB().notasFiscais.length + 1).padStart(3, '0'),
      data: new Date().toISOString().slice(0, 10),
      orcamentoId: o.id,
      clienteId: o.clienteId,
      itens: [{ desc: o.descricao, qtd: 1, valor: o.valor }],
      valorTotal: o.valor,
      status: 'Emitida',
    });
    saveDB(); refresh(); setConfirmNF(null);
  };

  const viewO = modal?.mode === 'view' ? db.orcamentos.find(o => o.id === modal.id) : null;
  const viewFormula = viewO?.formulaId ? allFormulas.find(f => f.id === viewO.formulaId) : null;
  const viewParts = viewFormula ? getFormulaParts(viewFormula) : { inputVars: [], resultVar: null };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs">{['Todos', 'Rascunho', 'Enviado', 'Aprovado', 'Rejeitado', 'Expirado'].map(s =>
          <div key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</div>
        )}</div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Orçamento</button>
      </div>

      {/* Table */}
      {list.length ? (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Código</th><th>Cliente</th><th>Fórmula</th><th>Valor</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>{list.map(o => (
            <tr key={o.id}>
              <td className="td-mono td-bold">{o.codigo}</td>
              <td>{getClientName(o.clienteId)}</td>
              <td>{o.formulaId ? getFormulaName(o.formulaId) : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Manual</span>}</td>
              <td className="td-mono" style={{ fontWeight: 600 }}>{fc(o.valor)}</td>
              <td><StatusBadge status={o.status} /></td>
              <td className="td-mono">{fd(o.data)}</td>
              <td className="actions-cell">
                <button className="btn-icon" onClick={() => openView(o.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                {o.status !== 'Aprovado' && <button className="btn-icon" onClick={() => openEdit(o.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}
                {o.status === 'Aprovado' && <button className="btn-icon" style={{ color: 'var(--green)' }} onClick={() => setConfirmNF(o.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M9 13l2 2 4-4"/></svg></button>}
                <button className="btn-icon" onClick={() => setConfirmDel(o.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <div className="empty"><p>Nenhum orçamento</p></div>}

      {/* ══════════ Create / Edit Modal ══════════ */}
      <IonModal isOpen={!!modal && modal.mode !== 'view'} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>{modal?.mode === 'edit' ? 'Editar Orçamento' : 'Novo Orçamento'}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>

            {/* Info básica */}
            <div className="field-row">
              <div className="field"><label>Código</label><input value={form.codigo || ''} onChange={e => setForm({ ...form, codigo: e.target.value })} /></div>
              <div className="field"><label>Status</label><select value={form.status || 'Rascunho'} onChange={e => setForm({ ...form, status: e.target.value })}>{['Rascunho','Enviado','Aprovado','Rejeitado','Expirado'].map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="field"><label>Cliente</label><select value={form.clienteId || ''} onChange={e => setForm({ ...form, clienteId: e.target.value })}>{db.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
            <div className="field"><label>Descrição</label><input value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="field-row">
              <div className="field"><label>Validade</label><input type="date" value={form.validade || ''} onChange={e => setForm({ ...form, validade: e.target.value })} /></div>
              <div className="field"><label>Aprovação</label><input type="date" value={form.dataAprovacao || ''} onChange={e => setForm({ ...form, dataAprovacao: e.target.value })} /></div>
            </div>

            {/* ═══ Seção: Usar Fórmula ═══ */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <IonIcon icon={calculatorOutline} style={{ fontSize: 18, color: 'var(--primary)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Usar Fórmula</span>
              </div>

              {/* Seletor de fórmula */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Selecionar Fórmula</label>
                <select value={formulaId} onChange={e => selectFormula(e.target.value)}>
                  <option value="">— Nenhuma (valor manual) —</option>
                  {allFormulas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              {allFormulas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>
                  Nenhuma fórmula criada. Vá até <strong>Fórmulas</strong> para criar uma.
                </div>
              )}

              {/* Preview da fórmula selecionada */}
              {selectedFormula && (
                <>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{selectedFormula.nome}</div>
                    <FormulaPreview latex={selectedFormula.latex} />
                    {selectedFormula.descricao && <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 8, fontStyle: 'italic' }}>{selectedFormula.descricao}</div>}
                    {parts.resultVar && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, background: 'rgba(14,203,129,.1)', border: '1px solid rgba(14,203,129,.25)', borderRadius: 100, padding: '2px 10px', color: 'var(--green)' }}>
                          Resolver para: {parts.resultVar}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Constantes (read-only) */}
                  {(selectedFormula.constantes || []).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>Constantes</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedFormula.constantes.map((c, i) => (
                          <span key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text2)' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.nome}</span> = {c.valor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variáveis de entrada */}
                  {parts.inputVars.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 8 }}>Preencher variáveis</label>
                      {parts.inputVars.map(v => (
                        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', marginBottom: 6 }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: 'var(--primary)', minWidth: 40, fontSize: 14 }}>{v}</span>
                          <span style={{ color: 'var(--muted)' }}>=</span>
                          <input
                            type="number"
                            step="any"
                            value={formulaVars[v] || ''}
                            onChange={e => setFormulaVars({ ...formulaVars, [v]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && calcular()}
                            placeholder="Valor"
                            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 14, outline: 'none' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão calcular */}
                  <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={calcular}>
                    <IonIcon icon={calculatorOutline} style={{ fontSize: 16 }} />
                    Calcular
                  </button>
                </>
              )}

              {/* Resultado */}
              {formulaResult !== null && (
                <div style={{ marginTop: 16, background: 'var(--card)', border: '2px solid var(--green)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                    {parts.resultVar ? `${parts.resultVar} =` : 'Resultado'}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{formulaResult}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Valor do orçamento: <strong style={{ color: 'var(--primary)' }}>{fc(formulaResult)}</strong></div>
                </div>
              )}

              {/* Valor manual (quando sem fórmula) */}
              {!formulaId && (
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Valor Manual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulaResult || ''}
                    onChange={e => setFormulaResult(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingBottom: 20 }}>
              <button className="btn btn-ghost" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* ══════════ View Modal ══════════ */}
      <IonModal isOpen={modal?.mode === 'view'} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>Orçamento {viewO?.codigo}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>
            {/* Info */}
            <div className="detail-grid">
              <div className="detail-field"><label>Cliente</label><span>{getClientName(viewO?.clienteId)}</span></div>
              <div className="detail-field"><label>Status</label><span><StatusBadge status={viewO?.status} /></span></div>
              <div className="detail-field"><label>Data</label><span>{fd(viewO?.data)}</span></div>
              <div className="detail-field"><label>Validade</label><span>{fd(viewO?.validade)}</span></div>
              {viewO?.dataAprovacao && <div className="detail-field"><label>Aprovação</label><span>{fd(viewO.dataAprovacao)}</span></div>}
              <div className="detail-field detail-full"><label>Descrição</label><span>{viewO?.descricao}</span></div>
            </div>

            {/* Fórmula usada */}
            {viewFormula && (
              <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <IonIcon icon={calculatorOutline} style={{ fontSize: 16, color: 'var(--primary)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Fórmula: {viewFormula.nome}</span>
                </div>
                <FormulaPreview latex={viewFormula.latex} />

                {/* Constantes */}
                {(viewFormula.constantes || []).length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {viewFormula.constantes.map((c, i) => (
                      <span key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text2)' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.nome}</span> = {c.valor}
                      </span>
                    ))}
                  </div>
                )}

                {/* Variáveis preenchidas */}
                {viewO?.formulaVars && Object.keys(viewO.formulaVars).length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>Variáveis utilizadas</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(viewO.formulaVars).map(([k, v]) => (
                        <span key={k} style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{k}</span> = {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resultado */}
            <div style={{ marginTop: 16, background: 'var(--card)', border: '2px solid var(--green)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                Valor do Orçamento
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 32, fontWeight: 700, color: 'var(--green)' }}>{fc(viewO?.valor)}</div>
            </div>

            {/* Ações */}
            {viewO?.status !== 'Aprovado' && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" onClick={() => setConfirmApprove(viewO?.id)}>✓ Aprovar</button>
              </div>
            )}
            {viewO?.status === 'Aprovado' && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" onClick={() => setConfirmNF(viewO?.id)}>Gerar NF</button>
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* Alerts */}
      <IonAlert isOpen={!!confirmDel} onDidDismiss={() => setConfirmDel(null)} header="Excluir" message="Excluir este orçamento?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: () => del(confirmDel) }]} />
      <IonAlert isOpen={!!confirmApprove} onDidDismiss={() => setConfirmApprove(null)} header="Aprovar" message="Aprovar este orçamento?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Aprovar', handler: () => approve(confirmApprove) }]} />
      <IonAlert isOpen={!!confirmNF} onDidDismiss={() => setConfirmNF(null)} header="Gerar NF" message="Gerar nota fiscal?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Gerar', handler: () => gerarNF(confirmNF) }]} />

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={2000} color={toast.includes('Erro') || toast.includes('Preencha') ? 'danger' : 'success'} position="bottom" />
    </div>
  );
}