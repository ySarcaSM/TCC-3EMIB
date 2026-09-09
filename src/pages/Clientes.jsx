// ═══════════════════════════════════════════════════════════
// CORREÇÕES APLICADAS — src/pages/Clientes.jsx
// ═══════════════════════════════════════════════════════════
//
// BUG #3 CORRIGIDO: del() agora usa o state `db` em vez de getDB()
// Antes: getDB().clientes = ... mutava o objeto global sem trigger de re-render
// Depois: db.clientes = ... muta o state local + saveDB() para persistir
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSearchbar, IonAlert, IonContent } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { getDB, loadDB, saveDB, uid, fd, fc } from '../services/db';
import { HistoryActions } from '../services/historyService';
import StatusBadge from '../components/StatusBadge';

// ═══ Validações ═══
function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateCPF(cpf) {
  if (!cpf) return true;
  const d = cpf.replace(/\D/g, '');
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    let s = 0; for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
    let r = 11 - (s % 11); if (r >= 10) r = 0;
    if (r !== parseInt(d[9])) return false;
    s = 0; for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
    r = 11 - (s % 11); if (r >= 10) r = 0;
    return r === parseInt(d[10]);
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0; for (let i = 0; i < 12; i++) s += parseInt(d[i]) * w1[i];
    let r = s % 11; const d1 = r < 2 ? 0 : 11 - r;
    if (parseInt(d[12]) !== d1) return false;
    s = 0; for (let i = 0; i < 13; i++) s += parseInt(d[i]) * w2[i];
    r = s % 11; const d2 = r < 2 ? 0 : 11 - r;
    return parseInt(d[13]) === d2;
  }
  return false;
}
function validatePhone(phone) {
  if (!phone) return true;
  const d = phone.replace(/\D/g, '');
  return d.length >= 10 && d.length <= 11;
}
function formatCPF(v) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
function formatPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export default function Clientes() {
  const [db, setDb] = useState(getDB);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDB().then(() => { setDb({ ...getDB() }); setLoading(false); });
  }, []);
  const [filter, setFilter] = useState('Todos');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const refresh = () => setDb({ ...getDB() });

  let list = db.clientes;
  if (search) list = list.filter(c => c.nome.toLowerCase().includes(search) || c.email.toLowerCase().includes(search) || c.documento.includes(search));
  if (filter !== 'Todos') list = list.filter(c => c.status === filter);

  const openNew = () => { setForm({ nome: '', email: '', telefone: '', documento: '', tipo: 'PJ', endereco: '', status: 'Ativo' }); setModal({ mode: 'new' }); };
  const openEdit = (id) => { setForm({ ...db.clientes.find(x => x.id === id) }); setModal({ mode: 'edit', id }); };
  const openView = (id) => setModal({ mode: 'view', id });
  const close = () => setModal(null);

  const save = () => {
    if (!form.nome) return;
    if (form.email && !validateEmail(form.email)) { alert('Email inválido.'); return; }
    if (form.documento && !validateCPF(form.documento)) { alert('CPF/CNPJ inválido.'); return; }
    if (form.telefone && !validatePhone(form.telefone)) { alert('Telefone inválido.'); return; }
    if (modal.mode === 'edit') {
      Object.assign(db.clientes.find(x => x.id === modal.id), form);
      HistoryActions.clientUpdated(form.nome);
    } else {
      db.clientes.push({ ...form, id: uid(), dataCadastro: new Date().toISOString().slice(0, 10) });
      HistoryActions.clientCreated(form.nome);
    }
    saveDB(); refresh(); close();
  };

  // ✅ BUG #3 CORRIGIDO: usa state `db` em vez de getDB() para mutação
  const del = (id) => {
    const c = db.clientes.find(c => c.id === id);
    HistoryActions.clientDeleted(c?.nome || 'Desconhecido');
    db.clientes = db.clientes.filter(c => c.id !== id);
    saveDB(); refresh(); setConfirmDel(null);
  };

  const viewC = modal?.mode === 'view' ? db.clientes.find(c => c.id === modal.id) : null;
  const viewOrcs = viewC ? db.orcamentos.filter(o => o.clienteId === viewC.id) : [];
  const viewTotal = viewOrcs.reduce((a, o) => a + (o.itens || []).reduce((s, i) => s + i.qtd * i.valor, 0), 0);

  const tabs = ['Todos', 'Ativo', 'Inativo'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs">{tabs.map(t => <div key={t} className={`tab-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t === 'Todos' ? `Todos (${db.clientes.length})` : t + 's'}</div>)}</div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Cliente</button>
      </div>

      {/* Search */}
      <IonSearchbar value={search} onIonInput={e => setSearch(e.detail.value)} placeholder="Buscar clientes..." style={{ marginBottom: 16 }} />

      {/* Table */}
      {loading ? <div className='empty'><p>Carregando...</p></div> : list.length ? (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Tipo</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr></thead>
          <tbody>{list.map(c => (
            <tr key={c.id}>
              <td className="td-bold">{c.nome}</td><td>{c.email}</td><td className="td-mono">{c.telefone}</td>
              <td><span className="badge b-novo">{c.tipo}</span></td><td><StatusBadge status={c.status} /></td>
              <td className="td-mono">{fd(c.dataCadastro)}</td>
              <td className="actions-cell">
                <button className="btn-icon" onClick={() => openView(c.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                <button className="btn-icon" onClick={() => openEdit(c.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                <button className="btn-icon" onClick={() => setConfirmDel(c.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <div className="empty"><p>Nenhum cliente cadastrado</p></div>}

      {/* Create / Edit Modal */}
      <IonModal isOpen={!!modal && modal.mode !== 'view'} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>{modal?.mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>
            <div className="field"><label>Nome / Razão Social</label><input value={form.nome || ''} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="field-row">
              <div className="field"><label>E-mail</label><input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="field"><label>Telefone</label><input value={form.telefone || ''} onChange={e => setForm({ ...form, telefone: formatPhone(e.target.value) })} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>CPF/CNPJ</label><input value={form.documento || ''} onChange={e => setForm({ ...form, documento: formatCPF(e.target.value) })} /></div>
              <div className="field"><label>Tipo</label><select value={form.tipo || 'PJ'} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>PF</option><option>PJ</option><option>ME</option></select></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Endereço</label><input value={form.endereco || ''} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número" /></div>
              <div className="field"><label>Cidade</label><input value={form.cidade || ''} onChange={e => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>CEP</label><input value={form.cep || ''} onChange={e => setForm({ ...form, cep: e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2') })} placeholder="00000-000" /></div>
              <div className="field"><label>Status</label><select value={form.status || 'Ativo'} onChange={e => setForm({ ...form, status: e.target.value })}><option>Ativo</option><option>Inativo</option></select></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={close}>Cancelar</button>
                <button className="btn btn-primary" onClick={save}>Salvar</button>
              </div>
            </div>
           </div>
        </IonContent>
      </IonModal>

      {/* View Modal */}
      <IonModal isOpen={modal?.mode === 'view'} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>Detalhes — {viewC?.nome}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>
            <div className="detail-grid">
              <div className="detail-field"><label>E-mail</label><span>{viewC?.email}</span></div>
              <div className="detail-field"><label>Telefone</label><span>{viewC?.telefone}</span></div>
              <div className="detail-field"><label>CPF/CNPJ</label><span className="td-mono">{viewC?.documento}</span></div>
              <div className="detail-field"><label>Tipo</label><span>{viewC?.tipo}</span></div>
              <div className="detail-field"><label>Status</label><span><StatusBadge status={viewC?.status} /></span></div>
              <div className="detail-field"><label>Cadastro</label><span>{fd(viewC?.dataCadastro)}</span></div>
              <div className="detail-field detail-full"><label>Endereço</label><span>{viewC?.endereco || '—'}</span></div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Orçamentos: <strong style={{ color: 'var(--text)' }}>{viewOrcs.length}</strong></span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Volume: <strong style={{ color: 'var(--primary)' }}>{fc(viewTotal)}</strong></span>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Confirm Delete */}
      <IonAlert isOpen={!!confirmDel} onDidDismiss={() => setConfirmDel(null)} header="Excluir" message="Excluir este cliente?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: () => del(confirmDel) }]} />
    </div>
  );
}
