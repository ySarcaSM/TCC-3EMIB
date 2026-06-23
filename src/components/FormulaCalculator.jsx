import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonToast } from '@ionic/react';
import { closeOutline, copyOutline } from 'ionicons/icons';
import FormulaPreview from './FormulaPreview';

function getWords(text, constNames) {
  const cleaned = text.replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
  return [...new Set(cleaned.split(/\s+/).filter(w => w.length >= 1 && /^[a-zA-Z]+$/.test(w)).filter(v => !new Set(['d','e','x','dx','dt','dy','dz']).has(v) && !constNames.has(v)))];
}

function getParts(latex, variaveis, constantes) {
  const constNames = new Set((constantes || []).map(c => c.nome));
  const allVars = (variaveis || []).filter(v => !constNames.has(v));
  if (!latex || !latex.includes('=')) return { inputVars: allVars, resultVar: null };
  const eq = latex.indexOf('=');
  const left = getWords(latex.substring(0, eq), constNames);
  const right = getWords(latex.substring(eq + 1), constNames);
  if (left.length === 1 && right.length >= 1) return { inputVars: right, resultVar: left[0] };
  if (right.length === 1 && left.length >= 1) return { inputVars: left, resultVar: right[0] };
  return { inputVars: allVars, resultVar: null };
}

export default function FormulaCalculator({ formula, onClose }) {
  const [vals, setVals] = useState({});
  const [result, setResult] = useState(null);
  const [resultText, setResultText] = useState('');
  const [toast, setToast] = useState('');

  const constantes = formula?.constantes || [];
  const { inputVars, resultVar } = formula ? getParts(formula.latex, formula.variaveis, formula.constantes) : { inputVars: [], resultVar: null };

  useEffect(() => {
    if (!formula) return;
    const init = {};
    (formula.constantes || []).forEach(c => { init[c.nome] = c.valor; });
    setVals(init);
    setResult(null);
    setResultText('');
  }, [formula]);

  const calc = () => {
    const missing = inputVars.filter(v => !vals[v] && vals[v] !== '0');
    if (missing.length) { setToast('Preencha: ' + missing.join(', ')); return; }
    try {
      let expr = formula.latex;
      if (expr.includes('=')) {
        const parts = expr.split('=');
        const lk = getWords(parts[0], new Set(constantes.map(c => c.nome)));
        const rk = getWords(parts[1], new Set(constantes.map(c => c.nome)));
        expr = lk.length > rk.length ? parts[0] : parts[parts.length - 1];
      }
      const sorted = Object.entries(vals).sort((a, b) => b[0].length - a[0].length);
      for (const [n, v] of sorted) {
        if (!v) continue;
        const r = new RegExp(`(?<![a-zA-Z])${n.replace(/[.*+?^${}()|[\]$$\\]/g, '\\$&')}(?![a-zA-Z])`, 'g');
        expr = expr.replace(r, `(${v})`);
      }
      expr = expr.replace(/\\left|\\right/g, '').replace(/\\text\{[^}]*\}/g, '0');
      expr = expr.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '(($1)/($2))');
      expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'Math.sqrt($1)');
      expr = expr.replace(/\^(\{[^}]+\}|\S+)/g, (_, e) => '**(' + e.replace(/[{}]/g, '') + ')');
      expr = expr.replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
      expr = expr.replace(/\\pi/g, `(${Math.PI})`).replace(/\\infty/g, 'Infinity');
      expr = expr.replace(/\\left$$/g, '(').replace(/\\right$$/g, ')');
      expr = expr.replace(/\\left$$/g, '[').replace(/\\right$$/g, ']');
      expr = expr.replace(/\\left\\\{/g, '(').replace(/\\right\\\}/g, ')');
      expr = expr.replace(/\\pm/g, '+').replace(/\\mp/g, '-');
      expr = expr.replace(/\\sin\(/g, 'Math.sin(').replace(/\\cos\(/g, 'Math.cos(').replace(/\\tan\(/g, 'Math.tan(');
      expr = expr.replace(/\\ln\(/g, 'Math.log(').replace(/\\log\(/g, 'Math.log10(').replace(/\\abs\(/g, 'Math.abs(');
      expr = expr.replace(/\\quad|\\,/g, ' ').replace(/\\\\/g, '').replace(/\\[a-zA-Z]+/g, '');
      expr = expr.replace(/[^0-9+\-*/().,%^ \n\r\t]/g, '');
      const r = Function('"use strict";return(' + expr + ')')();
      if (typeof r === 'number' && !isNaN(r) && isFinite(r)) {
        const v = parseFloat(r.toPrecision(10));
        setResult(v);
        setResultText(resultVar ? `${resultVar} = ${v}` : String(v));
      } else setToast('Não foi possível calcular');
    } catch { setToast('Erro na expressão'); }
  };

  if (!formula) return null;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Calcular — {formula.nome}</h2>
        <button className="btn-icon" onClick={onClose}><IonIcon icon={closeOutline} style={{ fontSize: 18 }} /></button>
      </div>

      <FormulaPreview latex={formula.latex} />

      {resultVar && (
        <div style={{ margin: '12px 0', display: 'inline-block' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--green)', background: 'rgba(14,203,129,.1)', border: '1px solid rgba(14,203,129,.25)', borderRadius: 100, padding: '2px 10px' }}>
            Resolver para: {resultVar}
          </span>
        </div>
      )}

      {constantes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 8 }}>Constantes</label>
          {constantes.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: 'var(--primary)', minWidth: 28 }}>{c.nome}</span>
              <span style={{ color: 'var(--muted)' }}>=</span>
              <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text)' }}>{c.valor}</span>
            </div>
          ))}
        </div>
      )}

      {inputVars.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 8 }}>Variáveis de entrada</label>
          {inputVars.map(v => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: 'var(--primary)', minWidth: 40 }}>{v}</span>
              <span style={{ color: 'var(--muted)' }}>=</span>
              <input type="number" step="any" value={vals[v] || ''} onChange={e => setVals({ ...vals, [v]: e.target.value })} onKeyDown={e => e.key === 'Enter' && calc()} placeholder="Valor" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 14, outline: 'none' }} />
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={calc}>Calcular</button>

      {result !== null && (
        <div style={{ marginTop: 20, background: 'var(--card)', border: '2px solid var(--green)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Resultado</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 32, fontWeight: 700, color: 'var(--green)', marginBottom: 16 }}>{result}</div>
          <button className="btn btn-success btn-sm" onClick={() => { navigator.clipboard.writeText(resultText); }}>Copiar</button>
        </div>
      )}

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={2000} color="danger" position="bottom" />
    </div>
  );
}