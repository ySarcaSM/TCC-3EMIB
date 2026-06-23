import React, { useState } from 'react';
import { IonIcon, IonToast } from '@ionic/react';
import { logInOutline, personAddOutline } from 'ionicons/icons';
import { api } from '../services/api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastColor, setToastColor] = useState('danger');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setToast('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.login(username.trim(), password)
        : await api.register(username.trim(), password);

      localStorage.setItem('angler_token', data.token);
      setToast('');
      onLogin(data.username);
    } catch (err) {
      setToast(err.message);
      setToastColor('danger');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 16, padding: 32,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--primary), #e8a020)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'var(--bg)',
          }}>A</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Angler</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Seu usuário"
              autoComplete="username"
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 14px', color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Sua senha"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 14px', color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '12px 0', marginTop: 4, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <IonIcon icon={mode === 'login' ? logInOutline : personAddOutline} style={{ fontSize: 18 }} />
            {loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
          </button>
        </div>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setToast(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13 }}
          >
            {mode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={3000} color={toastColor} position="bottom" />
    </div>
  );
}