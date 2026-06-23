import React, { useEffect, useRef } from 'react';

export default function FormulaPreview({ latex, large = false, card = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && window.katex && latex) {
      try {
        window.katex.render(latex, ref.current, { throwOnError: false, displayMode: true, output: 'html' });
      } catch {
        if (ref.current) ref.current.innerHTML = '<span style="color:var(--red);font-family:DM Mono,monospace;font-size:0.8rem;">Erro</span>';
      }
    } else if (ref.current && !latex) {
      ref.current.innerHTML = '';
    }
  }, [latex]);

  const cls = [
    'formula-preview-box',
    large ? 'formula-preview-box-large' : '',
    card ? 'formula-preview-card' : '',
  ].filter(Boolean).join(' ');

  return <div ref={ref} className={cls} />;
}