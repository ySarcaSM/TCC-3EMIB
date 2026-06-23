import React, { useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonItem,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonList,
  IonListHeader,
  IonButtons,
  IonBackButton,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  saveOutline,
  repeatOutline,
  informationCircleOutline,
  closeOutline,
  checkmarkCircleOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';
import FormulaPreview from '../components/FormulaPreview';
import LatexToolbar from '../components/LatexToolbar';
import {
  getAllFormulas,
  createFormula,
  updateFormula,
  getFormulaById,
} from '../services/formulaService';

const Editor = ({ match }) => {
  const editId = match?.params?.id || null;

  const [nome, setNome] = useState('');
  const [latex, setLatex] = useState('');
  const [descricao, setDescricao] = useState('');
  const [constantes, setConstantes] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState('primary');
  const [showReuseModal, setShowReuseModal] = useState(false);
  const [savedFormulas, setSavedFormulas] = useState([]);

  // Campos temporários para adicionar constante
  const [constName, setConstName] = useState('');
  const [constValue, setConstValue] = useState('');
  const [constDesc, setConstDesc] = useState('');

  useIonViewWillEnter(() => {
    setSavedFormulas(getAllFormulas());

    if (editId) {
      const existing = getFormulaById(editId);
      if (existing) {
        setNome(existing.nome);
        setLatex(existing.latex);
        setDescricao(existing.descricao);
        setConstantes(existing.constantes || []);
      }
    } else {
      setNome('');
      setLatex('');
      setDescricao('');
      setConstantes([]);
    }
  });

  const toast = useCallback((msg, color = 'primary') => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  }, []);

  const handleInsertSymbol = useCallback((symbol) => {
    setLatex((prev) => prev + symbol);
  }, []);

  const handleInsertSaved = useCallback(
    (formula) => {
      setLatex((prev) => (prev ? prev + ' \\quad ' : '') + formula.latex);
      setShowReuseModal(false);
      toast(`"${formula.nome}" inserida na expressão`);
    },
    [toast]
  );

  const handleAddConstant = useCallback(() => {
    if (!constName.trim()) {
      toast('Informe o nome da constante', 'danger');
      return;
    }
    if (!constValue.trim()) {
      toast('Informe o valor da constante', 'danger');
      return;
    }

    const name = constName.trim();
    const value = constValue.trim();

    const duplicate = constantes.find(
      (c) => c.nome.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      toast(`Constante "${name}" já existe`, 'danger');
      return;
    }

    if (name === value) {
      toast('Nome e valor da constante não podem ser iguais', 'danger');
      return;
    }

    setConstantes((prev) => [
      ...prev,
      {
        nome: name,
        valor: value,
        descricao: constDesc.trim(),
      },
    ]);
    setConstName('');
    setConstValue('');
    setConstDesc('');
    toast('Constante adicionada', 'success');
  }, [constName, constValue, constDesc, constantes, toast]);

  const handleRemoveConstant = useCallback((index) => {
    setConstantes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    if (!nome.trim()) {
      toast('Dê um nome à fórmula', 'danger');
      return;
    }
    if (!latex.trim()) {
      toast('Escreva a expressão LaTeX', 'danger');
      return;
    }

    if (editId) {
      const updated = updateFormula(editId, {
        nome: nome.trim(),
        latex: latex.trim(),
        descricao: descricao.trim(),
        constantes,
      });
      if (updated) {
        toast('Fórmula atualizada!', 'success');
        setSavedFormulas(getAllFormulas());
      } else {
        toast('Erro ao atualizar', 'danger');
      }
    } else {
      const result = createFormula({
        nome: nome.trim(),
        latex: latex.trim(),
        descricao: descricao.trim(),
        constantes,
      });
      if (result) {
        toast('Fórmula salva com sucesso!', 'success');
        setSavedFormulas(getAllFormulas());
        setNome('');
        setLatex('');
        setDescricao('');
        setConstantes([]);
      } else {
        toast('Erro ao salvar', 'danger');
      }
    }
  }, [nome, latex, descricao, constantes, editId, toast]);

  const detectVariables = (lx, consts) => {
    if (!lx) return [];
    const cleaned = lx.replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
    const words = cleaned
      .split(/\s+/)
      .filter((w) => w.length >= 1 && /^[a-zA-Z]+$/.test(w));
    const ignore = new Set(['d', 'e', 'x', 'dx', 'dt', 'dy', 'dz']);
    const constantNames = new Set(
      (consts || []).map((c) => c.nome.toLowerCase())
    );
    return [
      ...new Set(
        words.filter(
          (v) => !ignore.has(v) && !constantNames.has(v.toLowerCase())
        )
      ),
    ].sort();
  };

  const variaveis = detectVariables(latex, constantes);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {editId && (
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" text="Voltar" />
            </IonButtons>
          )}
          <IonTitle>{editId ? 'Editar Fórmula' : 'Editor de Fórmulas'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Preview ao vivo */}
        <div style={{ padding: '1.5rem 1.5rem 0.5rem' }}>
          <div className="section-label">Preview em tempo real</div>
          {latex ? (
            <FormulaPreview latex={latex} />
          ) : (
            <div className="formula-preview-box">
              <span style={{ color: '#6a6270', fontStyle: 'italic' }}>
                Digite uma fórmula em LaTeX...
              </span>
            </div>
          )}

          {variaveis.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div className="section-label">Variáveis detectadas</div>
              <div>
                {variaveis.map((v) => (
                  <span key={v} className="variable-pill">{v}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toolbar LaTeX */}
        <div style={{ padding: '0 1.5rem' }}>
          <div className="section-label">Atalhos LaTeX</div>
          <div
            style={{
              background: '#0e0e18',
              border: '1px solid #2a2a3d',
              borderRadius: '10px',
              padding: '0.5rem',
            }}
          >
            <LatexToolbar onInsert={handleInsertSymbol} />
          </div>
        </div>

        {/* Formulário */}
        <div style={{ padding: '1rem 1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <IonLabel
              className="section-label"
              style={{ display: 'block', marginBottom: '0.5rem', paddingLeft: '4px' }}
            >
              Expressão LaTeX
            </IonLabel>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Ex: x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              rows={4}
              style={{
                width: '100%',
                background: '#0e0e18',
                border: '1px solid #2a2a3d',
                borderRadius: '10px',
                padding: '12px',
                color: '#f0ece4',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.88rem',
                lineHeight: '1.7',
                outline: 'none',
                resize: 'vertical',
                display: 'block',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#e8a838'; }}
              onBlur={(e) => { e.target.style.borderColor = '#2a2a3d'; }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <IonLabel
              className="section-label"
              style={{ display: 'block', marginBottom: '0.5rem', paddingLeft: '4px' }}
            >
              Nome da Fórmula
            </IonLabel>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bhaskara"
              style={{
                width: '100%',
                background: '#0e0e18',
                border: '1px solid #2a2a3d',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#f0ece4',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.95rem',
                outline: 'none',
                display: 'block',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#e8a838'; }}
              onBlur={(e) => { e.target.style.borderColor = '#2a2a3d'; }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <IonLabel
              className="section-label"
              style={{ display: 'block', marginBottom: '0.5rem', paddingLeft: '4px' }}
            >
              Descrição
            </IonLabel>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Resolve equações quadráticas"
              style={{
                width: '100%',
                background: '#0e0e18',
                border: '1px solid #2a2a3d',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#f0ece4',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.95rem',
                outline: 'none',
                display: 'block',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#e8a838'; }}
              onBlur={(e) => { e.target.style.borderColor = '#2a2a3d'; }}
            />
          </div>

          {/* ─── Constantes ─── */}
          <div
            style={{
              background: '#0e0e18',
              border: '1px solid #2a2a3d',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <IonLabel
                className="section-label"
                style={{ marginBottom: 0, paddingLeft: '2px' }}
              >
                Constantes
              </IonLabel>
              {constantes.length > 0 && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.6rem',
                    color: '#6a6270',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {constantes.length} definida{constantes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Constantes já adicionadas */}
            {constantes.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                {constantes.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#141420',
                      border: '1px solid #2a2a3d',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: '#e8a838',
                          flexShrink: 0,
                        }}
                      >
                        {c.nome}
                      </span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          color: '#f0ece4',
                          flexShrink: 0,
                        }}
                      >
                        = {c.valor}
                      </span>
                      {c.descricao && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: '#6a6270',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          — {c.descricao}
                        </span>
                      )}
                    </div>
                    <IonButton
                      size="small"
                      fill="clear"
                      color="danger"
                      style={{ '--padding-start': '4px', '--padding-end': '4px', flexShrink: 0 }}
                      onClick={() => handleRemoveConstant(i)}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: '0.9rem' }} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}

            {/* Campos para adicionar nova constante */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <input
                type="text"
                value={constName}
                onChange={(e) => setConstName(e.target.value)}
                placeholder="Nome"
                style={{
                  background: '#141420',
                  border: '1px solid #2a2a3d',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#e8a838',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  outline: 'none',
                  display: 'block',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#e8a838'; }}
                onBlur={(e) => { e.target.style.borderColor = '#2a2a3d'; }}
              />
              <input
                type="text"
                value={constValue}
                onChange={(e) => setConstValue(e.target.value)}
                placeholder="Valor (ex: 9.81, 3.14159)"
                style={{
                  background: '#141420',
                  border: '1px solid #2a2a3d',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#f0ece4',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                  display: 'block',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#e8a838'; }}
                onBlur={(e) => { e.target.style.borderColor = '#2a2a3d'; }}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.5rem',
              }}
            >
              <input
                type="text"
                value={constDesc}
                onChange={(e) => setConstDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                style={{
                  background: '#141420',
                  border: '1px solid #2a2a3d',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#f0ece4',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                  display: 'block',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#e8a838'; }}
                onBlur={(e) => { e.target.style.borderColor = '#2a2a3d'; }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddConstant();
                }}
              />
              <IonButton
                size="small"
                color="primary"
                onClick={handleAddConstant}
                style={{
                  '--padding-start': '12px',
                  '--padding-end': '12px',
                  '--padding-top': '8px',
                  '--padding-bottom': '8px',
                  minHeight: '36px',
                }}
              >
                <IonIcon icon={addOutline} slot="icon-only" style={{ fontSize: '1rem' }} />
              </IonButton>
            </div>

            {/* Constantes comuns sugeridas */}
            {constantes.length === 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.6rem',
                    color: '#6a6270',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.4rem',
                  }}
                >
                  Sugestões rápidas
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {[
                    { nome: 'g', valor: '9.81', descricao: 'gravidade (m/s²)' },
                    { nome: 'π', valor: '3.14159', descricao: 'pi' },
                    { nome: 'c', valor: '299792458', descricao: 'velocidade da luz (m/s)' },
                    { nome: 'e', valor: '2.71828', descricao: 'número de Euler' },
                  ].map((s) => (
                    <button
                      key={s.nome}
                      className="toolbar-btn"
                      onClick={() => {
                        const exists = constantes.find(
                          (c) => c.nome === s.nome
                        );
                        if (!exists) {
                          setConstantes((prev) => [...prev, s]);
                          toast(`"${s.nome}" adicionada`, 'success');
                        } else {
                          toast(`"${s.nome}" já existe`, 'danger');
                        }
                      }}
                      title={`${s.nome} = ${s.valor} — ${s.descricao}`}
                    >
                      {s.nome} = {s.valor}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <IonGrid>
            <IonRow>
              <IonCol>
                <IonButton expand="block" color="primary" onClick={handleSave}>
                  <IonIcon icon={saveOutline} slot="start" />
                  {editId ? 'Atualizar Fórmula' : 'Salvar Fórmula'}
                </IonButton>
              </IonCol>
              {!editId && (
                <IonCol>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="primary"
                    onClick={() => setShowReuseModal(true)}
                  >
                    <IonIcon icon={repeatOutline} slot="start" />
                    Reutilizar
                  </IonButton>
                </IonCol>
              )}
            </IonRow>
          </IonGrid>
        </div>

        {/* Modal: reutilizar fórmula existente */}
        <IonModal
          isOpen={showReuseModal}
          onDidDismiss={() => setShowReuseModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Reutilizar Fórmula</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                color="primary"
                onClick={() => setShowReuseModal(false)}
              >
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonListHeader>
              <IonLabel className="section-label">
                Selecione uma fórmula para inserir na expressão
              </IonLabel>
            </IonListHeader>
            {savedFormulas.length > 0 ? (
              <IonList>
                {savedFormulas.map((f) => (
                  <IonItem
                    key={f.id}
                    button
                    onClick={() => handleInsertSaved(f)}
                    detail={false}
                    style={{ cursor: 'pointer' }}
                  >
                    <IonLabel>
                      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontSize: '1.15rem' }}>
                        {f.nome}
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#b0a898' }}>
                        {f.descricao}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6a6270' }}>
                <p>Nenhuma fórmula salva ainda</p>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          color={toastColor}
          position="bottom"
          icon={toastColor === 'success' ? checkmarkCircleOutline : informationCircleOutline}
        />
      </IonContent>
    </IonPage>
  );
};

export default Editor;