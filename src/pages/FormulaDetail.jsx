import React, { useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonActionSheet,
  IonNote,
  IonLabel,
  IonModal,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  starOutline,
  star,
  createOutline,
  trashOutline,
  copyOutline,
  ellipsisVertical,
  checkmarkCircleOutline,
  closeOutline,
  saveOutline,
  calculatorOutline,
} from 'ionicons/icons';
import FormulaPreview from '../components/FormulaPreview';
import LatexToolbar from '../components/LatexToolbar';
import FormulaCalculator from '../components/FormulaCalculator';
import {
  getFormulaById,
  updateFormula,
  deleteFormula,
} from '../services/formulaService';

const FormulaDetail = ({ match, history }) => {
  const { id } = match.params;
  const [formula, setFormula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState('primary');
  const [showActions, setShowActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  const [editNome, setEditNome] = useState('');
  const [editLatex, setEditLatex] = useState('');
  const [editDescricao, setEditDescricao] = useState('');

  useIonViewWillEnter(() => {
    const f = getFormulaById(id);
    if (f) {
      setFormula(f);
      setEditNome(f.nome);
      setEditLatex(f.latex);
      setEditDescricao(f.descricao);
    }
    setLoading(false);
  });

  const toast = useCallback((msg, color = 'primary') => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  }, []);

  const handleCopy = useCallback(() => {
    if (formula) {
      navigator.clipboard.writeText(formula.latex).then(() => {
        toast('LaTeX copiado!', 'success');
      }).catch(() => {
        toast('Erro ao copiar', 'danger');
      });
    }
  }, [formula, toast]);

  const handleCopyConstantes = useCallback(() => {
    if (formula && formula.constantes && formula.constantes.length > 0) {
      const text = formula.constantes
        .map((c) => `${c.nome} = ${c.valor}${c.descricao ? ' — ' + c.descricao : ''}`)
        .join('\n');
      navigator.clipboard.writeText(text).then(() => {
        toast('Constantes copiadas!', 'success');
      }).catch(() => {
        toast('Erro ao copiar', 'danger');
      });
    }
  }, [formula, toast]);

  const handleToggleFavorite = useCallback(() => {
    if (!formula) return;
    const updated = updateFormula(id, { favorito: !formula.favorito });
    if (updated) {
      setFormula(updated);
      toast(updated.favorito ? 'Adicionada aos favoritos' : 'Removida dos favoritos');
    }
  }, [id, formula, toast]);

  const handleDelete = useCallback(() => {
    deleteFormula(id);
    toast('Fórmula excluída', 'danger');
    setTimeout(() => history.push('/home'), 800);
  }, [id, history, toast]);

  const handleSaveEdit = useCallback(() => {
    if (!editNome.trim()) {
      toast('Nome obrigatório', 'danger');
      return;
    }
    if (!editLatex.trim()) {
      toast('Expressão obrigatória', 'danger');
      return;
    }

    const updated = updateFormula(id, {
      nome: editNome.trim(),
      latex: editLatex.trim(),
      descricao: editDescricao.trim(),
    });

    if (updated) {
      setFormula(updated);
      setShowEditModal(false);
      toast('Fórmula atualizada!', 'success');
    }
  }, [id, editNome, editLatex, editDescricao, toast]);

  const openEditModal = useCallback(() => {
    if (formula) {
      setEditNome(formula.nome);
      setEditLatex(formula.latex);
      setEditDescricao(formula.descricao);
    }
    setShowEditModal(true);
  }, [formula]);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" text="Voltar" />
            </IonButtons>
            <IonTitle>Carregando...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent />
      </IonPage>
    );
  }

  if (!formula) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" text="Voltar" />
            </IonButtons>
            <IonTitle>Não encontrada</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6a6270' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '1.5rem', color: '#b0a898' }}>
              Fórmula não encontrada
            </h3>
            <IonButton fill="outline" color="primary" style={{ marginTop: '1rem' }} onClick={() => history.push('/home')}>
              Voltar ao Início
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Voltar" />
          </IonButtons>
          <IonTitle>{formula.nome}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowActions(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Fórmula renderizada */}
        <div style={{ padding: '1.5rem' }}>
          <FormulaPreview latex={formula.latex} large />
        </div>

        {/* Botão calcular */}
        <div style={{ padding: '0 1.5rem 1rem' }}>
          <IonButton
            expand="block"
            color="success"
            onClick={() => setShowCalcModal(true)}
          >
            <IonIcon icon={calculatorOutline} slot="start" />
            Calcular com esta fórmula
          </IonButton>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.5rem 1rem', flexWrap: 'wrap' }}>
          {formula.favorito && (
            <IonChip style={{ background: 'rgba(232, 168, 56, 0.2)', borderColor: '#e8a838' }}>
              <IonIcon icon={star} style={{ color: '#e8a838', marginRight: '4px' }} />
              Favorita
            </IonChip>
          )}
          <IonNote style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#6a6270' }}>
            Criada em {formula.criadoEm}
          </IonNote>
        </div>

        {/* Descrição */}
        {formula.descricao && (
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1.1rem' }}>Descrição</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p style={{ fontSize: '0.95rem', color: '#b0a898', lineHeight: '1.7' }}>
                  {formula.descricao}
                </p>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Constantes */}
        {formula.constantes && formula.constantes.length > 0 && (
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <IonCard>
              <IonCardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IonCardTitle style={{ fontSize: '1.1rem' }}>
                  Constantes
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.6rem',
                      color: '#6a6270',
                      marginLeft: '0.5rem',
                      verticalAlign: 'middle',
                    }}
                  >
                    ({formula.constantes.length})
                  </span>
                </IonCardTitle>
                <IonButton size="small" fill="clear" color="primary" onClick={handleCopyConstantes}>
                  <IonIcon icon={copyOutline} slot="icon-only" />
                </IonButton>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formula.constantes.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#0a0a14',
                        border: '1px solid #2a2a3d',
                        borderRadius: '8px',
                        padding: '0.7rem 1rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: '#e8a838',
                          minWidth: '28px',
                        }}
                      >
                        {c.nome}
                      </span>
                      <span style={{ color: '#6a6270', fontSize: '0.8rem', flexShrink: 0 }}>=</span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.9rem',
                          color: '#f0ece4',
                          fontWeight: 400,
                          background: '#141420',
                          border: '1px solid #2a2a3d',
                          borderRadius: '4px',
                          padding: '0.15rem 0.5rem',
                        }}
                      >
                        {c.valor}
                      </span>
                      {c.descricao && (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: '#6a6270',
                            marginLeft: 'auto',
                            fontStyle: 'italic',
                          }}
                        >
                          {c.descricao}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Variáveis */}
        {formula.variaveis && formula.variaveis.length > 0 && (
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1.1rem' }}>Variáveis</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {formula.variaveis.map((v) => (
                  <span key={v} className="variable-pill">{v}</span>
                ))}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Código LaTeX */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <IonCard>
            <IonCardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IonCardTitle style={{ fontSize: '1.1rem' }}>Código LaTeX</IonCardTitle>
              <IonButton size="small" fill="clear" color="primary" onClick={handleCopy}>
                <IonIcon icon={copyOutline} slot="start" />
                Copiar
              </IonButton>
            </IonCardHeader>
            <IonCardContent>
              <div className="latex-code-block">{formula.latex}</div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Info técnica */}
        <div style={{ padding: '0 1.5rem 2rem' }}>
          <IonGrid>
            <IonRow style={{ display: 'flex', alignItems: 'stretch' }}>
              <IonCol size="4" style={{ display: 'flex' }}>
                <div
                  style={{
                    background: '#141420',
                    border: '1px solid #2a2a3d',
                    borderRadius: '10px',
                    padding: '1rem',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div className="section-label">ID</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#b0a898', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                    {formula.id}
                  </div>
                </div>
              </IonCol>
              <IonCol size="4" style={{ display: 'flex' }}>
                <div
                  style={{
                    background: '#141420',
                    border: '1px solid #2a2a3d',
                    borderRadius: '10px',
                    padding: '1rem',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div className="section-label">Variáveis</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: '#e8a838', marginTop: '0.25rem' }}>
                    {formula.variaveis ? formula.variaveis.length : 0}
                  </div>
                </div>
              </IonCol>
              <IonCol size="4" style={{ display: 'flex' }}>
                <div
                  style={{
                    background: '#141420',
                    border: '1px solid #2a2a3d',
                    borderRadius: '10px',
                    padding: '1rem',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div className="section-label">Constantes</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: '#e8a838', marginTop: '0.25rem' }}>
                    {formula.constantes ? formula.constantes.length : 0}
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActions}
          onDidDismiss={() => setShowActions(false)}
          header="Ações"
          buttons={[
            {
              text: formula.favorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos',
              icon: formula.favorito ? star : starOutline,
              handler: handleToggleFavorite,
            },
            {
              text: 'Editar Fórmula',
              icon: createOutline,
              handler: openEditModal,
            },
            {
              text: 'Copiar LaTeX',
              icon: copyOutline,
              handler: handleCopy,
            },
            {
              text: 'Excluir',
              role: 'destructive',
              icon: trashOutline,
              handler: handleDelete,
            },
            {
              text: 'Cancelar',
              role: 'cancel',
            },
          ]}
        />

        {/* Modal de Edição */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton fill="clear" color="primary" onClick={() => setShowEditModal(false)}>
                  <IonIcon icon={closeOutline} slot="icon-only" />
                </IonButton>
              </IonButtons>
              <IonTitle>Editar Fórmula</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" color="primary" onClick={handleSaveEdit}>
                  <IonIcon icon={saveOutline} slot="icon-only" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '1rem' }}>
              <div className="section-label" style={{ padding: '0 0.5rem' }}>Preview</div>
              <FormulaPreview latex={editLatex} />

              <div style={{ marginTop: '1rem' }}>
                <div className="section-label" style={{ padding: '0 0.5rem' }}>Atalhos LaTeX</div>
                <div style={{ background: '#0e0e18', border: '1px solid #2a2a3d', borderRadius: '10px', padding: '0.5rem' }}>
                  <LatexToolbar onInsert={(sym) => setEditLatex((prev) => prev + sym)} />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <IonLabel className="section-label" style={{ display: 'block', marginBottom: '0.5rem', paddingLeft: '4px' }}>Nome</IonLabel>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
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
                />
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <IonLabel className="section-label" style={{ display: 'block', marginBottom: '0.5rem', paddingLeft: '4px' }}>LaTeX</IonLabel>
                <textarea
                  value={editLatex}
                  onChange={(e) => setEditLatex(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    background: '#0e0e18',
                    border: '1px solid #2a2a3d',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#f0ece4',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    lineHeight: '1.7',
                    outline: 'none',
                    resize: 'vertical',
                    display: 'block',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <IonLabel className="section-label" style={{ display: 'block', marginBottom: '0.5rem', paddingLeft: '4px' }}>Descrição</IonLabel>
                <input
                  type="text"
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
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
                />
              </div>

              <IonButton expand="block" color="primary" onClick={handleSaveEdit} style={{ marginTop: '1.5rem' }}>
                <IonIcon icon={saveOutline} slot="start" />
                Salvar Alterações
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal de Calculadora */}
        <IonModal
          isOpen={showCalcModal}
          onDidDismiss={() => setShowCalcModal(false)}
        >
          <FormulaCalculator
            formula={formula}
            onDismiss={() => setShowCalcModal(false)}
          />
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          color={toastColor}
          position="bottom"
          icon={toastColor === 'success' ? checkmarkCircleOutline : undefined}
        />
      </IonContent>
    </IonPage>
  );
};

export default FormulaDetail;