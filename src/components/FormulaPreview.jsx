import React, { useEffect, useRef } from 'react';

const FormulaPreview = ({ latex, large = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && window.katex && latex) {
      try {
        window.katex.render(latex, ref.current, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        });
      } catch {
        if (ref.current) {
          ref.current.innerHTML =
            '<span style="color:#e84057;font-family:JetBrains Mono,monospace;font-size:0.8rem;">Erro na expressão</span>';
        }
      }
    } else if (ref.current && !latex) {
      ref.current.innerHTML = '';
    }
  }, [latex]);

  return (
    <div
      ref={ref}
      className={`formula-preview-box ${large ? 'formula-preview-box-large' : ''}`}
    />
  );
};

export default FormulaPreview;