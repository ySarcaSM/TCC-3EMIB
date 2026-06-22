import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonNote,
  IonButton,
} from '@ionic/react';
import { star, starOutline, createOutline, trashOutline } from 'ionicons/icons';
import FormulaPreview from './FormulaPreview';

const FormulaCard = ({ formula, onClick, onEdit, onDelete }) => {
  return (
    <IonCard button onClick={onClick} style={{ cursor: 'pointer' }}>
      <IonCardHeader
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '0.5rem',
        }}
      >
        <IonCardTitle style={{ flex: 1 }}>{formula.nome}</IonCardTitle>
        <IonIcon
          icon={formula.favorito ? star : starOutline}
          style={{
            color: formula.favorito ? '#e8a838' : '#6a6270',
            fontSize: '1.2rem',
            flexShrink: 0,
            marginLeft: '0.5rem',
          }}
        />
      </IonCardHeader>

      <IonCardContent>
        <FormulaPreview latex={formula.latex} />

        {formula.descricao && (
          <p
            style={{
              fontSize: '0.88rem',
              color: '#b0a898',
              marginTop: '1rem',
              marginBottom: '0.75rem',
              lineHeight: '1.6',
            }}
          >
            {formula.descricao}
          </p>
        )}

        {/* Constantes resumo */}
        {formula.constantes && formula.constantes.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.3rem',
              marginBottom: '0.75rem',
            }}
          >
            {formula.constantes.map((c, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: 'rgba(232, 168, 56, 0.08)',
                  border: '1px solid rgba(232, 168, 56, 0.15)',
                  color: '#e8a838',
                }}
              >
                {c.nome}={c.valor}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
          }}
        >
          <IonNote
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.68rem',
              color: '#6a6270',
            }}
          >
            {formula.criadoEm}
          </IonNote>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <IonButton
              size="default"
              fill="solid"
              color="primary"
              style={{
                '--padding-start': '14px',
                '--padding-end': '14px',
                '--padding-top': '10px',
                '--padding-bottom': '10px',
                minHeight: '40px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(formula);
              }}
            >
              <IonIcon icon={createOutline} slot="icon-only" style={{ fontSize: '1.1rem' }} />
            </IonButton>
            <IonButton
              size="default"
              fill="solid"
              color="danger"
              style={{
                '--padding-start': '14px',
                '--padding-end': '14px',
                '--padding-top': '10px',
                '--padding-bottom': '10px',
                minHeight: '40px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(formula);
              }}
            >
              <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: '1.1rem' }} />
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default FormulaCard;