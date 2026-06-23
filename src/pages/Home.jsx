import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonChip,
  IonAlert,
  IonModal,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  flaskOutline,
  addCircleOutline,
  star,
} from 'ionicons/icons';
import FormulaCard from '../components/FormulaCard';
import FormulaCalculator from '../components/FormulaCalculator';
import { getAllFormulas, deleteFormula } from '../services/formulaService';

const Home = ({ history }) => {
  const location = useLocation();
  const [formulas, setFormulas] = useState([]);
  const [search, setSearch] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState(null);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [formulaToCalc, setFormulaToCalc] = useState(null);

  const refresh = () => {
    setFormulas([...getAllFormulas()]);
  };

  // Ionic lifecycle — fires on tab switch
  useIonViewWillEnter(() => {
    refresh();
  });

  // Fallback — fires when route changes
  useEffect(() => {
    refresh();
  }, [location.pathname]);

  const handleEdit = (formula) => {
    history.push(`/editor/${formula.id}`);
  };

  const handleDeleteClick = (formula) => {
    setFormulaToDelete(formula);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = () => {
    if (formulaToDelete) {
      deleteFormula(formulaToDelete.id);
      refresh();
    }
    setFormulaToDelete(null);
  };

  const handleCalc = (formula) => {
    setFormulaToCalc(formula);
    setShowCalcModal(true);
  };

  const filtered = formulas.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.nome.toLowerCase().includes(q) ||
      f.descricao.toLowerCase().includes(q) ||
      f.latex.toLowerCase().includes(q)
    );
  });

  const favoritasCount = formulas.filter((f) => f.favorito).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <IonIcon
                icon={flaskOutline}
                style={{ color: '#e8a838', fontSize: '1.2rem' }}
              />
              MathForge
            </span>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div style={{ padding: '2rem 1.5rem 1rem' }}>
          <h1 className="hero-title">
            Construa fórmulas.
            <br />
            <em>Reutilize</em> sempre.
          </h1>
          <p className="hero-subtitle">
            Editor LaTeX com preview ao vivo, detecção de variáveis e
            reutilização de expressões.
          </p>
          <IonButton
            color="primary"
            style={{ marginTop: '1rem' }}
            onClick={() => history.push('/editor')}
          >
            <IonIcon icon={addCircleOutline} slot="start" />
            Nova Fórmula
          </IonButton>
        </div>

        {formulas.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem 1.5rem 0.5rem',
              borderTop: '1px solid #2a2a3d',
              marginTop: '1rem',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#6a6270',
              }}
            >
              {formulas.length} fórmula{formulas.length !== 1 ? 's' : ''}{' '}
              criada{formulas.length !== 1 ? 's' : ''}
            </span>
            {favoritasCount > 0 && (
              <IonChip style={{ margin: 0 }}>
                <IonIcon
                  icon={star}
                  style={{
                    color: '#e8a838',
                    marginRight: '4px',
                    fontSize: '0.8rem',
                  }}
                />
                {favoritasCount} favorita{favoritasCount !== 1 ? 's' : ''}
              </IonChip>
            )}
          </div>
        )}

        {formulas.length > 0 && (
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value)}
            placeholder="Pesquisar fórmulas..."
            debounce={200}
            style={{ padding: '0.5rem 1rem' }}
          />
        )}

        {filtered.length > 0 ? (
          <IonGrid style={{ padding: '0 1rem 2rem' }}>
            <IonRow>
              {filtered.map((f) => (
                <IonCol
                  size="12"
                  sizeMd="6"
                  sizeLg="4"
                  key={f.id}
                  style={{ display: 'flex' }}
                >
                  <FormulaCard
                    formula={f}
                    onClick={() => history.push(`/formula/${f.id}`)}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onCalc={handleCalc}
                  />
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : formulas.length > 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6a6270',
            }}
          >
            <p>
              Nenhuma fórmula encontrada para "{search}"
            </p>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              color: '#6a6270',
            }}
          >
            <IonIcon
              icon={flaskOutline}
              style={{
                fontSize: '3rem',
                color: '#2a2a3d',
                display: 'block',
                margin: '0 auto 1rem',
              }}
            />
            <h3
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: 300,
                fontSize: '1.5rem',
                color: '#b0a898',
                marginBottom: '0.5rem',
              }}
            >
              Nenhuma fórmula ainda
            </h3>
            <p style={{ marginBottom: '1rem' }}>
              Crie sua primeira fórmula no editor
            </p>
            <IonButton
              fill="outline"
              color="primary"
              size="small"
              onClick={() => history.push('/editor')}
            >
              <IonIcon icon={addCircleOutline} slot="start" />
              Criar fórmula
            </IonButton>
          </div>
        )}

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Excluir fórmula"
          message={
            formulaToDelete
              ? `Tem certeza que deseja excluir "${formulaToDelete.nome}"?`
              : ''
          }
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Excluir',
              role: 'destructive',
              handler: handleConfirmDelete,
            },
          ]}
        />

        <IonModal
          isOpen={showCalcModal}
          onDidDismiss={() => setShowCalcModal(false)}
        >
          <FormulaCalculator
            formula={formulaToCalc}
            onDismiss={() => setShowCalcModal(false)}
          />
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;