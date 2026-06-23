import React from 'react';
import FormulaPreview from './FormulaPreview';

export default function FormulaCard({ formula, onClick, onCalc, onEdit, onDelete }) {
  return (
    <div className="formula-card" onClick={onClick}>
      <div className="formula-card-header">
        <h3>{formula.nome}</h3>
        {formula.favorito && <span style={{ color: 'var(--primary)' }}>★</span>}
      </div>
      <FormulaPreview latex={formula.latex} card />
      {formula.descricao && <p className="formula-card-desc">{formula.descricao}</p>}
      {formula.constantes?.length > 0 && (
        <div className="formula-card-consts">
          {formula.constantes.map((c, i) => (
            <span key={i} className="formula-const-chip">{c.nome}={c.valor}</span>
          ))}
        </div>
      )}
      <div className="formula-card-actions">
        <span className="formula-card-date">{formula.criadoEm}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-success" onClick={(e) => { e.stopPropagation(); onCalc?.(formula); }}>Calcular</button>
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(formula); }}>Editar</button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); onDelete?.(formula); }}>Excluir</button>
        </div>
      </div>
    </div>
  );
}
