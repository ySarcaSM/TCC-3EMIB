import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSearchbar, IonAlert, IonToast, IonContent } from '@ionic/react';
import { closeOutline, addOutline, trashOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { getAllFormulas, createFormula, updateFormula, deleteFormula } from '../services/formulaService';
import { HistoryActions } from '../services/historyService';
import FormulaCard from '../components/FormulaCard';
import FormulaPreview from '../components/FormulaPreview';
import FormulaCalculator from '../components/FormulaCalculator';
import LatexToolbar from '../components/LatexToolbar';

const IGNORE = new Set(['d', 'e', 'x', 'dx', 'dt', 'dy', 'dz']);

export default function Formulas() {
  const [formulas, setFormulas] = useState(getAllFormulas);
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showCalc, setShowCalc] = useState(false);
  const [calcFormula, setCalcFormula] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // Editor state
  const [nome, setNome] = useState('');
  const [latex, setLatex] = useState('');
  const [descricao, setDescricao] = useState('');
  const [constantes, setConstantes] = useState([]);
  const [constName, setConstName] = useState('');
  const [constValue, setConstValue] = useState('');
  const [constDesc, setConstDesc] = useState('');

  const [toast, setToast] = useState('');
  const [toastColor, setToastColor] = useState('success');

  const refresh = () => setFormulas([...getAllFormulas()]);
  const showToast = (msg, color = 'success') => { setToast(msg); setToastColor(color); };

  const openNew = () => {
    setEditId(null); setNome(''); setLatex(''); setDescricao(''); setConstantes([]);
    setConstName(''); setConstValue(''); setConstDesc('');
    setShowEditor(true);
  };
  const openEdit = (f) => {
    setEditId(f.id); setNome(f.nome); setLatex(f.latex); setDescricao(f.descricao);
    setConstantes([...(f.constantes || [])]);
    setConstName(''); setConstValue(''); setConstDesc('');
    setShowEditor(true);
  };
  const closeEditor = () => setShowEditor(false);

  const addConstant = () => {
    if (!constName.trim()) { showToast('Informe o nome', 'danger'); return; }
    if (!constValue.trim()) { showToast('Informe o valor', 'danger'); return; }
    if (constName.trim() === constValue.trim()) { showToast('Nome e valor não podem ser iguais', 'danger'); return; }
    if (constantes.find(c => c.nome.toLowerCase() === constName.trim().toLowerCase())) { showToast('Constante já existe', 'danger'); return; }
    setConstantes([...constantes, { nome: constName.trim(), valor: constValue.trim(), descricao: constDesc.trim() }]);
    setConstName(''); setConstValue(''); setConstDesc('');
  };
  const removeConstant = (i) => setConstantes(constantes.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!nome.trim()) { showToast('Dê um nome', 'danger'); return; }
    if (!latex.trim()) { showToast('Escreva a fórmula', 'danger'); return; }
    if (editId) {
      updateFormula(editId, { nome: nome.trim(), latex: latex.trim(), descricao: descricao.trim(), constantes });
      HistoryActions.formulaUpdated(nome.trim());
      showToast('Fórmula atualizada!');
    } else {
      createFormula({ nome: nome.trim(), latex: latex.trim(), descricao: descricao.trim(), constantes });
      HistoryActions.formulaCreated(nome.trim());
      showToast('Fórmula criada!');
    }
    refresh(); closeEditor();
  };

  const handleDelete = (id) => {
    const f = getAllFormulas().find(f => f.id === id);
    HistoryActions.formulaDeleted(f?.nome || 'Desconhecida');
    deleteFormula(id); refresh(); setConfirmDel(null); showToast('Fórmula excluída', 'danger');
  };
  const openCalc = (f) => { setCalcFormula(f); setShowCalc(true); };

  const detectVars = (lx, consts) => {
    if (!lx) return [];
    const cleaned = lx.replace(/\\[a-zA-Z]+/g, '').replace(/[^a-zA-Z]/g, ' ');
    const words = cleaned.split(/\s+/).filter(w => w.length >= 1 && /^[a-zA-Z]+$/.test(w));
    const cn = new Set((consts || []).map(c => c.nome.toLowerCase()));
    return [...new Set(words.filter(v => !IGNORE.has(v) && !cn.has(v.toLowerCase())))].sort();
  };
  const variaveis = detectVars(latex, constantes);

  let list = formulas;
  if (search) list = list.filter(f => f.nome.toLowerCase().includes(search) || f.descricao.toLowerCase().includes(search));

  const QUICK_CONSTS = [
    { nome: 'g', valor: '9.81', descricao: 'gravidade (m/s²)' },
    { nome: 'π', valor: '3.14159', descricao: 'pi' },
    { nome: 'c', valor: '299792458', descricao: 'vel. luz (m/s)' },
    { nome: 'e', valor: '2.71828', descricao: 'Euler' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{formulas.length} fórmula{formulas.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={openNew}>+ Nova Fórmula</button>
      </div>

      <IonSearchbar value={search} onIonInput={e => setSearch(e.detail.value)} placeholder="Buscar fórmulas..." style={{ marginBottom: 20 }} />

      {/* Cards Grid */}
      {list.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {list.map(f => (
            <FormulaCard key={f.id} formula={f} onClick={() => openCalc(f)} onCalc={openCalc} onEdit={openEdit} onDelete={(formula) => setConfirmDel(formula.id)} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.4 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
          <p>{search ? 'Nenhuma fórmula encontrada' : 'Nenhuma fórmula criada ainda'}</p>
          {!search && <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={openNew}>Criar primeira fórmula</button>}
        </div>
      )}

      {/* Editor Modal */}
      <IonModal isOpen={showEditor} onDidDismiss={closeEditor}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>{editId ? 'Editar Fórmula' : 'Nova Fórmula'}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={closeEditor}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <div style={{ padding: 24 }}>
            {/* Preview */}
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 8 }}>Preview</label>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflowX: 'auto' }}>
              {latex ? <FormulaPreview latex={latex} /> : <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>Digite a fórmula...</span>}
            </div>
            {variaveis.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', alignSelf: 'center', marginRight: 4 }}>Variáveis:</span>
                {variaveis.map(v => <span key={v} style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, background: 'rgba(252,213,53,.1)', border: '1px solid rgba(252,213,53,.2)', borderRadius: 100, padding: '2px 8px', color: 'var(--primary)' }}>{v}</span>)}
              </div>
            )}

            {/* Toolbar */}
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>Atalhos LaTeX</label>
            <LatexToolbar onInsert={(sym) => setLatex(prev => prev + sym)} />

            {/* Fields */}
            <div className="field" style={{ marginTop: 16 }}>
              <label>Expressão LaTeX</label>
              <textarea value={latex} onChange={e => setLatex(e.target.value)} rows={4} style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, lineHeight: 1.7 }} placeholder="Ex: x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
            </div>
            <div className="field"><label>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Bhaskara" /></div>
            <div className="field"><label>Descrição</label><input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Resolve equações quadráticas" /></div>

            {/* Constantes */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 10 }}>Constantes</label>
              {constantes.length > 0 && constantes.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: 'var(--primary)', minWidth: 28 }}>{c.nome}</span>
                  <span style={{ color: 'var(--muted)' }}>=</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{c.valor}</span>
                  {c.descricao && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto', fontStyle: 'italic' }}>{c.descricao}</span>}
                  <button className="btn-icon" onClick={() => removeConstant(i)}><IonIcon icon={trashOutline} style={{ fontSize: 14, color: 'var(--red)' }} /></button>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 6, marginBottom: 6 }}>
                <input value={constName} onChange={e => setConstName(e.target.value)} placeholder="Nome" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--primary)', fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 600, outline: 'none' }} />
                <input value={constValue} onChange={e => setConstValue(e.target.value)} placeholder="Valor (ex: 9.81)" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
                <input value={constDesc} onChange={e => setConstDesc(e.target.value)} placeholder="Descrição (opcional)" onKeyDown={e => e.key === 'Enter' && addConstant()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, outline: 'none' }} />
                <IonButton size="small" color="primary" onClick={addConstant} style={{ '--padding-start': '10px', '--padding-end': '10px', minHeight: '32px' }}><IonIcon icon={addOutline} /></IonButton>
              </div>
              {constantes.length === 0 && (
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Sugestões rápidas</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {QUICK_CONSTS.map(s => (
                      <button key={s.nome} className="latex-toolbar-btn" onClick={() => { if (!constantes.find(c => c.nome === s.nome)) { setConstantes([...constantes, s]); showToast(`"${s.nome}" adicionada`); } }} title={`${s.nome} = ${s.valor} — ${s.descricao}`}>{s.nome} = {s.valor}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingBottom: 20 }}>
              <button className="btn btn-ghost" onClick={closeEditor}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Atualizar' : 'Salvar'} Fórmula</button>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Calculator Modal */}
      <IonModal isOpen={showCalc} onDidDismiss={() => setShowCalc(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>Calcular — {calcFormula?.nome}</IonTitle>
            <IonButtons slot="end"><IonButton onClick={() => setShowCalc(false)}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--card)' }}>
          <FormulaCalculator formula={calcFormula} onClose={() => setShowCalc(false)} />
        </IonContent>
      </IonModal>

      {/* Confirm Delete */}
      <IonAlert isOpen={!!confirmDel} onDidDismiss={() => setConfirmDel(null)} header="Excluir Fórmula" message="Excluir esta fórmula?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: () => handleDelete(confirmDel) }]} />

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={2000} color={toastColor} position="bottom" icon={toastColor === 'success' ? checkmarkCircleOutline : informationCircleOutline} />
    </div>
  );
}