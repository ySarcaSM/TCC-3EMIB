import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@angler.com');
  const [pass, setPass] = useState('123456');

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 40px', width: 400, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--on-primary)' }}>A</div>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>angler</span>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>Sistema de Gestão Empresarial</p>
            <div className="field"><label>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="field"><label>Senha</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, height: 42 }} onClick={onLogin}>Entrar no Sistema</button>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>Use as credenciais preenchidas para demonstração</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}