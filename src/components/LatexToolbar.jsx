import React from 'react';

const SYMBOLS = [
  { l: 'frac', i: '\\frac{}{}' }, { l: '√', i: '\\sqrt{}' }, { l: '²', i: '^2' }, { l: 'ⁿ', i: '^n' },
  { l: '₁', i: '_1' }, { l: '∫', i: '\\int_{}^{} ' }, { l: 'Σ', i: '\\sum_{i=1}^{n} ' },
  { l: 'lim', i: '\\lim_{x \\to }' }, { l: '∞', i: '\\infty' }, { l: 'π', i: '\\pi' },
  { l: 'θ', i: '\\theta' }, { l: 'α', i: '\\alpha' }, { l: 'β', i: '\\beta' },
  { l: '±', i: '\\pm' }, { l: '·', i: '\\cdot' }, { l: '×', i: '\\times' },
  { l: '÷', i: '\\div' }, { l: '≠', i: '\\neq' }, { l: '≈', i: '\\approx' },
  { l: '≤', i: '\\leq' }, { l: '≥', i: '\\geq' },
  { l: '()', i: '\\left( \\right)' }, { l: '[]', i: '\\left[ \\right]' },
];

export default function LatexToolbar({ onInsert }) {
  return (
    <div className="latex-toolbar">
      {SYMBOLS.map(s => (
        <button key={s.l} className="latex-toolbar-btn" onClick={() => onInsert(s.i)} title={s.i}>{s.l}</button>
      ))}
    </div>
  );
}