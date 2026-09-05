import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSearchbar, IonAlert, IonContent } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { getDB, saveDB, uid, fc } from '../services/db';
import { HistoryActions } from '../services/historyService';
import StatusBadge from '../components/StatusBadge';

export default function Produtos() {
  const [db, setDb] = useState(getDB);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const refresh = () => setDb({ ...getDB() });
  let list = db.produtos;
  if (search) list = list.filter(p => p.nome.toLowerCase().includes(search) || p.categoria.toLowerCase().includes(search));
  if (filter !== 'Todos') list = list.filter(p => p.status === filter);

  const openNew = () => { setForm({ nome: '', descricao: '', categoria: 'Brinde', valor: 0, estoque: 0, status: 'Ativo' }); setModal({ mode: 'new' }); };
  const openEdit = (id) => { setForm({ ...db.produtos.find(x => x.id === id) }); setModal({ mode: 'edit', id }); };
  const openView = (id) => setModal({ mode: 'view', id });
  const close = () => setModal(null);

  const save = () => {
    if (!form.nome) return;
    if (modal.mode === 'edit') {
      Object.assign(db.produtos.find(x => x.id === modal.id), form);
      HistoryActions.productUpdated(form.nome);
    } else {
      db.produtos.push({ ...form, id: uid() });
      HistoryActions.productCreated(form.nome);
    }
    saveDB(); refresh(); close();
  };
  const del = (id) => {
    const p = getDB().produtos.find(p => p.id === id);
    HistoryActions.productDeleted(p?.nome || 'Desconhecido');
    getDB().produtos = getDB().produtos.filter(p => p.id !== id);
    saveDB(); refresh(); setConfirmDel(null);
  };

  const viewP = modal?.mode === 'view' ? db.produtos.find(p => p.id === modal.id) : null;
  const cats = ['Brinde', 'Serviço', 'Software', 'Material', 'Outro'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs">{['Todos', 'Ativo', 'Inativo'].map(t => <div key={t} className={`tab-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t === 'Todos' ? `Todos (${db.produtos.length})` : t + 's'}</div>)}</div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Produto</button>
      </div>

      {/* Search */}
      <IonSearchbar value={search} onIonInput={e => setSearch(e.detail.value)} placeholder="Buscar produtos..." style={{ marginBottom: 16 }} />

      {/* Table */}
      {list.length ? (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Nome</th><th>Categoria</th><th>Valor</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>{list.map(p => (
            <tr key={p.id}>
              <td className="td-bold">{p.nome}</td>
              <td><span className="badge b-novo">{p.categoria}</span></td>
              <td className="td-mono">{fc(p.valor)}</td>
              <td className="td-mono">{p.estoque}</td>
              <td><StatusBadge status={p.status} /></td>
              <td className="actions-cell">
                <button className="btn-icon" onClick={() => openView(p.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                <button className="btn-icon" onClick={() => openEdit(p.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button className="btn-icon" onClick={() => setConfirmDel(p.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <div className="empty"><p>Nenhum produto cadastrado</p></div>}

      {/* Create / Edit Modal */}
      <IonModal isOpen={!!modal && modal.mode !== 'view'} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>{modal?.mode === 'edit' ? 'Editar Produto' : 'Novo Produto'}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>
            <div className="field"><label>Nome</label><input value={form.nome || ''} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="field"><label>Descrição</label><input value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="field-row">
              <div className="field"><label>Categoria</label><select value={form.categoria || 'Brinde'} onChange={e => setForm({ ...form, categoria: e.target.value })}>{cats.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="field"><label>Status</label><select value={form.status || 'Ativo'} onChange={e => setForm({ ...form, status: e.target.value })}><option>Ativo</option><option>Inativo</option></select></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Valor (R$)</label><input type="number" step="0.01" value={form.valor || ''} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} /></div>
              <div className="field"><label>Estoque</label><input type="number" value={form.estoque || ''} onChange={e => setForm({ ...form, estoque: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* View Modal */}
      <IonModal isOpen={modal?.mode === 'view'} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>Detalhes — {viewP?.nome}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>
            <div className="detail-grid">
              <div className="detail-field"><label>Nome</label><span>{viewP?.nome}</span></div>
              <div className="detail-field"><label>Categoria</label><span>{viewP?.categoria}</span></div>
              <div className="detail-field"><label>Valor</label><span className="td-mono">{fc(viewP?.valor)}</span></div>
              <div className="detail-field"><label>Estoque</label><span className="td-mono">{viewP?.estoque}</span></div>
              <div className="detail-field"><label>Status</label><span><StatusBadge status={viewP?.status} /></span></div>
              <div className="detail-field detail-full"><label>Descrição</label><span>{viewP?.descricao || '—'}</span></div>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Confirm Delete */}
      <IonAlert isOpen={!!confirmDel} onDidDismiss={() => setConfirmDel(null)} header="Excluir" message="Excluir este produto?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: () => del(confirmDel) }]} />
    </div>
  );
}