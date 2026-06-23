import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { addOutline, closeOutline } from 'ionicons/icons';
import { fc } from '../services/db';

export default function ItemsEditor({ items, onChange }) {
  const update = (i, field, val) => {
    const next = [...items];
    if (field === 'desc') next[i].desc = val;
    else if (field === 'qtd') next[i].qtd = Math.max(1, parseInt(val) || 1);
    else if (field === 'valor') next[i].valor = Math.max(0, parseFloat(val) || 0);
    onChange(next);
  };

  const add = () => onChange([...items, { desc: '', qtd: 1, valor: 0 }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const total = items.reduce((a, i) => a + i.qtd * i.valor, 0);

  return (
    <div className="items-editor">
      <div className="items-editor-header">
        <label>Itens do Orçamento</label>
        <IonButton size="small" fill="outline" onClick={add}>
          <IonIcon icon={addOutline} slot="start" /> Adicionar
        </IonButton>
      </div>
      <table className="items-table">
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Descrição</th>
            <th style={{ width: '12%' }}>Qtd</th>
            <th style={{ width: '20%' }}>Valor Unit.</th>
            <th style={{ width: '20%' }}>Subtotal</th>
            <th style={{ width: '8%' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td><input value={item.desc} onChange={(e) => update(i, 'desc', e.target.value)} /></td>
              <td><input type="number" min="1" value={item.qtd} onChange={(e) => update(i, 'qtd', e.target.value)} /></td>
              <td><input type="number" step="0.01" min="0" value={item.valor} onChange={(e) => update(i, 'valor', e.target.value)} /></td>
              <td className="item-subtotal">{fc(item.qtd * item.valor)}</td>
              <td>
                {items.length > 1 && (
                  <button className="btn-icon" onClick={() => remove(i)}>
                    <IonIcon icon={closeOutline} style={{ color: 'var(--red)', fontSize: '14px' }} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="items-total">Total: {fc(total)}</div>
    </div>
  );
}