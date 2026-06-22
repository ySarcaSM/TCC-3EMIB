import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
} from '@ionic/react';
import { libraryOutline, addCircleOutline } from 'ionicons/icons';
import FormulaCard from '../components/FormulaCard';
import { getAllFormulas } from '../services/formulaService';

const Biblioteca = ({ history }) => {
  const [formulas, setFormulas] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategoria, setActiveCategoria] = useState('Todas');

  useEffect(() => {
    setFormulas(getAllFormulas());
  }, []);

  const categorias = useMemo(() => {
    return ['Todas', ...new Set(formulas.map((f) => f.categoria))];
  }, [formulas]);

  const filtered = useMemo(() => {
    return formulas.filter((f) => {
      const matchesSearch =
        !search ||
        f.nome.toLowerCase().includes(search.toLowerCase()) ||
        f.descricao.toLowerCase().includes(search.toLowerCase()) ||
        f.latex.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        activeCategoria === 'Todas' || f.categoria === activeCategoria;

      return matchesSearch && matchesCat;
    });
  }, [formulas, search, activeCategoria]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IonIcon icon={libraryOutline} style={{ color: '#e8a838', fontSize: '1.1rem' }} />
              Biblioteca
            </span>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {formulas.length > 0 && (
          <>
            <IonSearchbar
              value={search}
              onIonInput={(e) => setSearch(e.detail.value)}
              placeholder="Pesquisar fórmulas..."
              debounce={200}
              style={{ padding: '0.5rem 1rem' }}
            />

            {categorias.length > 2 && (
              <div style={{ padding: '0 1rem 1rem', overflowX: 'auto' }}>
                <IonSegment
                  value={activeCategoria}
                  onIonChange={(e) => setActiveCategoria(e.detail.value)}
                  scrollable
                  mode="md"
                >
                  {categorias.map((cat) => (
                    <IonSegmentButton key={cat} value={cat}>
                      <IonLabel>{cat}</IonLabel>
                    </IonSegmentButton>
                  ))}
                </IonSegment>
              </div>
            )}

            <div
              style={{
                padding: '0 1.5rem 0.5rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.68rem',
                color: '#6a6270',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {filtered.length} fórmula{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </div>
          </>
        )}

        {filtered.length > 0 ? (
          <IonGrid style={{ padding: '0 1rem 2rem' }}>
            <IonRow>
              {filtered.map((f) => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={f.id}>
                  <FormulaCard
                    formula={f}
                    onClick={() => history.push(`/biblioteca/${f.id}`)}
                  />
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6a6270' }}>
            <IonIcon
              icon={libraryOutline}
              style={{ fontSize: '3rem', color: '#2a2a3d', display: 'block', margin: '0 auto 1rem' }}
            />
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '1.4rem', color: '#b0a898', marginBottom: '0.5rem' }}>
              {search ? 'Nenhuma fórmula encontrada' : 'Biblioteca vazia'}
            </h3>
            <p style={{ marginBottom: '1rem' }}>
              {search ? 'Tente outro termo de pesquisa' : 'Crie sua primeira fórmula no editor'}
            </p>
            {!search && (
              <IonButton
                fill="outline"
                color="primary"
                size="small"
                onClick={() => history.push('/editor')}
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Criar fórmula
              </IonButton>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Biblioteca;