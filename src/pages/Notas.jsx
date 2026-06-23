import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonAlert } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { getDB, saveDB, fd, fc } from '../services/db';
import StatusBadge from '../components/StatusBadge';

export default function Notas() {
  const [db, setDb] = useState(getDB);
  const [modal, setModal] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const refresh = () => setDb({ ...getDB() });
  const getClientName = (id) => db.clientes.find(c => c.id === id)?.nome || '—';
  const getOrcCodigo = (id) => db.orcamentos.find(o => o.id === id)?.codigo || '—';

  const view = (id) => setModal(id);
  const close = () => setModal(null);
  const cancelar = (id) => {
    const n = getDB().notasFiscais.find(x => x.id === id);
    if (n) n.status = 'Cancelada';
    saveDB(); refresh(); setConfirmCancel(null);
  };

  const viewN = modal ? db.notasFiscais.find(n => n.id === modal) : null;
  const viewCli = viewN ? db.clientes.find(c => c.id === viewN.clienteId) : null;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>
        Notas Fiscais ({db.notasFiscais.length})
      </h2>

      {/* Table */}
      {db.notasFiscais.length ? (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>Número</th><th>Data</th><th>Cliente</th><th>Orçamento</th><th>Valor Total</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {db.notasFiscais.map(n => (
                <tr key={n.id}>
                  <td className="td-mono td-bold">{n.numero}</td>
                  <td className="td-mono">{fd(n.data)}</td>
                  <td>{getClientName(n.clienteId)}</td>
                  <td className="td-mono">{getOrcCodigo(n.orcamentoId)}</td>
                  <td className="td-mono" style={{ fontWeight: 600, color: 'var(--green)' }}>{fc(n.valorTotal)}</td>
                  <td><StatusBadge status={n.status} /></td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => view(n.id)} title="Ver">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    {n.status === 'Emitida' && (
                      <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => setConfirmCancel(n.id)} title="Cancelar NF">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty"><p>Nenhuma nota fiscal emitida</p></div>
      )}

      {/* View Modal */}
      <IonModal isOpen={!!modal} onDidDismiss={close}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>NF {viewN?.numero}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={close}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <div style={{ padding: 24 }}>
          <div className="nf-print">
            {/* Cabeçalho da NF */}
            <div className="nf-header">
              <div>
                <h3>NOTA FISCAL</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Angler — Sistema de Gestão Empresarial</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="nf-number">{viewN?.numero}</div>
                <div style={{ marginTop: 4 }}><StatusBadge status={viewN?.status} /></div>
              </div>
            </div>

            {/* Info */}
            <div className="detail-grid" style={{ marginBottom: 16 }}>
              <div className="detail-field"><label>Data de Emissão</label><span>{fd(viewN?.data)}</span></div>
              <div className="detail-field"><label>Orçamento de Origem</label><span>{getOrcCodigo(viewN?.orcamentoId)}</span></div>
            </div>

            {/* Cliente */}
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--card)', borderRadius: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Dados do Cliente</label>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{viewCli?.nome}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>CPF/CNPJ: {viewCli?.documento} · {viewCli?.telefone}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{viewCli?.email}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{viewCli?.endereco}</div>
            </div>

            {/* Itens */}
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Itens</label>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Qtd</th><th>Descrição</th><th>Valor Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(viewN?.itens || []).map((i, idx) => (
                    <tr key={idx}>
                      <td>{i.qtd}</td>
                      <td>{i.desc}</td>
                      <td className="td-mono">{fc(i.valor)}</td>
                      <td className="td-mono">{fc(i.qtd * i.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ textAlign: 'right', marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--primary)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>Valor Total: </span>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono',monospace", color: 'var(--primary)' }}>
                {fc(viewN?.valorTotal)}
              </span>
            </div>
          </div>
        </div>
      </IonModal>

      {/* Confirm Cancel */}
      <IonAlert
        isOpen={!!confirmCancel}
        onDidDismiss={() => setConfirmCancel(null)}
        header="Cancelar Nota Fiscal"
        message="Cancelar esta nota fiscal? Esta ação não pode ser desfeita."
        buttons={[
          { text: 'Voltar', role: 'cancel' },
          { text: 'Cancelar NF', role: 'destructive', handler: () => cancelar(confirmCancel) },
        ]}
      />
    </div>
  );
}