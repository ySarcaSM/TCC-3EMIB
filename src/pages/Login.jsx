import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon, IonToast } from '@ionic/react';
import { logInOutline, personAddOutline, arrowBackOutline, mailOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { api } from '../services/api';

export default function Login({ mode, onLogin }) {
  const history = useHistory();

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [step, setStep] = useState(1); // 1=dados, 2=código
  const [regName, setRegName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastColor, setToastColor] = useState('danger');

  const isLogin = mode === 'login';

  // ─── Login ───
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setToast('Preencha usuário e senha.');
      setToastColor('danger');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      sessionStorage.setItem('angler_token', data.token);
      setToast('');
      onLogin(data.username);
    } catch (err) {
      setToast(err.message);
      setToastColor('danger');
    }
    setLoading(false);
  };

  // ─── Cadastro Step 1: enviar código ───
  const handleSendCode = async () => {
    if (!regName.trim() || !regLastName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setToast('Preencha todos os campos.');
      setToastColor('danger');
      return;
    }
    if (regPassword.length < 6) {
      setToast('Senha precisa ter pelo menos 6 caracteres.');
      setToastColor('danger');
      return;
    }
    if (regPassword !== regConfirm) {
      setToast('As senhas não conferem.');
      setToastColor('danger');
      return;
    }
    setLoading(true);
    try {
      await api.sendCode({
        name: regName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
      });
      setToast('Código enviado para seu email!');
      setToastColor('success');
      setStep(2);
    } catch (err) {
      setToast(err.message);
      setToastColor('danger');
    }
    setLoading(false);
  };

  // ─── Cadastro Step 2: verificar código ───
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setToast('Digite o código de verificação.');
      setToastColor('danger');
      return;
    }
    setLoading(true);
    try {
      const data = await api.verifyCode(regEmail.trim(), verificationCode.trim());
      sessionStorage.setItem('angler_token', data.token);
      setToast('');
      onLogin(data.username);
    } catch (err) {
      setToast(err.message);
      setToastColor('danger');
    }
    setLoading(false);
  };

  // ─── Reenviar código ───
  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.sendCode({
        name: regName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
      });
      setToast('Novo código enviado!');
      setToastColor('success');
    } catch (err) {
      setToast(err.message);
      setToastColor('danger');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '14px 16px', color: 'var(--text)', fontSize: 16, outline: 'none',
  };

  const labelStyle = {
    fontSize: 14, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6,
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Botão voltar */}
        <button
          onClick={() => {
            if (!isLogin && step === 2) {
              setStep(1);
              setVerificationCode('');
              setToast('');
            } else {
              history.push('/');
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 15, marginBottom: 24,
          }}
        >
          <IonIcon icon={arrowBackOutline} style={{ fontSize: 18 }} />
          {!isLogin && step === 2 ? 'Voltar' : 'Voltar'}
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--primary), #e8a020)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'var(--bg)',
          }}>A</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Angler</h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginTop: 4 }}>
            {isLogin ? 'Entre na sua conta' : step === 1 ? 'Crie sua conta' : 'Verifique seu email'}
          </p>
        </div>

        {/* ════════════ LOGIN ════════════ */}
        {isLogin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Usuário</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Seu usuário" autoComplete="username" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Sua senha" autoComplete="current-password" style={inputStyle} />
            </div>
            <button className="btn btn-primary" onClick={handleLogin} disabled={loading}
              style={{ width: '100%', padding: '14px 0', marginTop: 4, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={logInOutline} style={{ fontSize: 20 }} />
              {loading ? 'Aguarde...' : 'Entrar'}
            </button>
          </div>
        )}

        {/* ════════════ CADASTRO STEP 1 — Dados ════════════ */}
        {!isLogin && step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                  placeholder="Nome" autoComplete="given-name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sobrenome</label>
                <input type="text" value={regLastName} onChange={e => setRegLastName(e.target.value)}
                  placeholder="Sobrenome" autoComplete="family-name" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                placeholder="seu@email.com" autoComplete="email" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Usuário</label>
              <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                placeholder="Escolha um usuário" autoComplete="username" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirmar Senha</label>
              <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                placeholder="Repita a senha" autoComplete="new-password" style={inputStyle} />
            </div>
            <button className="btn btn-primary" onClick={handleSendCode} disabled={loading}
              style={{ width: '100%', padding: '14px 0', marginTop: 4, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={personAddOutline} style={{ fontSize: 20 }} />
              {loading ? 'Aguarde...' : 'Criar Conta'}
            </button>
          </div>
        )}

        {/* ════════════ CADASTRO STEP 2 — Código ════════════ */}
        {!isLogin && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(14,203,129,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <IonIcon icon={mailOutline} style={{ fontSize: 32, color: 'var(--green)' }} />
            </div>
            <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Enviamos um código de 6 dígitos para<br />
              <strong style={{ color: 'var(--text)' }}>{regEmail}</strong>
            </p>
            <div style={{ width: '100%' }}>
              <label style={labelStyle}>Código de Verificação</label>
              <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                placeholder="000000" maxLength={6}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 28, letterSpacing: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace" }} />
            </div>
            <button className="btn btn-primary" onClick={handleVerifyCode} disabled={loading}
              style={{ width: '100%', padding: '14px 0', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20 }} />
              {loading ? 'Verificando...' : 'Verificar e Entrar'}
            </button>
            <button onClick={handleResendCode} disabled={loading}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14 }}>
              Reenviar código
            </button>
          </div>
        )}

        {/* Toggle login/cadastro */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => {
              history.push(isLogin ? '/cadastro' : '/login');
              setStep(1);
              setVerificationCode('');
              setToast('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 15 }}
          >
            {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={4000} color={toastColor} position="bottom" />
    </div>
  );
}
