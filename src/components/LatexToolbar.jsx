import React from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';

const SYMBOLS = [
  { label: 'frac', insert: '\\frac{}{}' },
  { label: '√', insert: '\\sqrt{}' },
  { label: '²', insert: '^2' },
  { label: 'ⁿ', insert: '^n' },
  { label: '₁', insert: '_1' },
  { label: '∫', insert: '\\int_{}^{} ' },
  { label: 'Σ', insert: '\\sum_{i=1}^{n} ' },
  { label: 'Π', insert: '\\prod_{i=1}^{n} ' },
  { label: 'lim', insert: '\\lim_{x \\to }' },
  { label: '∞', insert: '\\infty' },
  { label: 'π', insert: '\\pi' },
  { label: 'θ', insert: '\\theta' },
  { label: 'α', insert: '\\alpha' },
  { label: 'β', insert: '\\beta' },
  { label: '±', insert: '\\pm' },
  { label: '·', insert: '\\cdot' },
  { label: '×', insert: '\\times' },
  { label: '÷', insert: '\\div' },
  { label: '≠', insert: '\\neq' },
  { label: '≈', insert: '\\approx' },
  { label: '≤', insert: '\\leq' },
  { label: '≥', insert: '\\geq' },
  { label: '()', insert: '\\left( \\right)' },
  { label: '[]', insert: '\\left[ \\right]' },
  { label: '{}', insert: '\\left\\{ \\right\\}' },
];

const LatexToolbar = ({ onInsert }) => {
  return (
    <IonGrid style={{ padding: '0.5rem' }}>
      <IonRow>
        {SYMBOLS.map((sym) => (
          <IonCol size="auto" key={sym.label} style={{ padding: '2px' }}>
            <button
              className="toolbar-btn"
              onClick={() => onInsert(sym.insert)}
              title={sym.insert}
            >
              {sym.label}
            </button>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
};

export default LatexToolbar;