import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon, IonToast } from '@ionic/react';
import {
  logInOutline, personAddOutline, arrowBackOutline,
  mailOutline, checkmarkCircleOutline, keyOutline,
  personOutline, lockClosedOutline,
} from 'ionicons/icons';
import { api } from '../services/api';

// ═══════════════════════════════════════════
// Estilos reutilizáveis
// ═══════════════════════════════════════════
const inputStyle = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '14px 16px', color: 'var(--text)', fontSize: 16, outline: 'none',
};

const labelStyle = {
  fontSize: 14, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6,
};

const linkBtn = {
  background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14,
};

// ═══════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════
export default function Login({ mode, onLogin }) {
  const history = useHistory();

  // ── View: 'login' | 'register' | 'forgot' | 'forgot-username'
  const [view, setView] = useState(mode === 'login' ? 'login' : 'register');

  // ── Sub-step para flows multi-step
  const [step, setStep] = useState(1);

  // ── Login
  const [loginInput, setLoginInput] = useState(''); // username ou email
  const [loginPass, setLoginPass] = useState('');

  // ── Cadastro
  const [regName, setRegName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // ── Esqueceu senha
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');

  // ── Esqueceu usuário
  const [forgotUserEmail, setForgotUserEmail] = useState('');

  // ── Código genérico
  const [verificationCode, setVerificationCode] = useState('');

  // ── UI
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastColor, setToastColor] = useState('danger');

  const show = (msg, color = 'danger') => { setToast(msg); setToastColor(color); };

  // ═══════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════
  const handleLogin = async () => {
    if (!loginInput.trim() || !loginPass.trim()) {
      show('Preencha usuário/email e senha.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(loginInput.trim(), loginPass);
      sessionStorage.setItem('angler_token', data.token);
      setToast('');
      onLogin(data.username);
    } catch (err) {
      show(err.message);
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════
  // CADASTRO — Step 1: enviar código
  // ═══════════════════════════════════════════
  const handleSendCode = async () => {
    if (!regName.trim() || !regLastName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      show('Preencha todos os campos.');
      return;
    }
    if (regPassword.length < 6) { show('Senha precisa ter pelo menos 6 caracteres.'); return; }
    if (regPassword !== regConfirm) { show('As senhas não conferem.'); return; }
    setLoading(true);
    try {
      await api.sendCode({ name: regName.trim(), lastName: regLastName.trim(), email: regEmail.trim(), username: regUsername.trim(), password: regPassword });
      show('Código enviado para seu email!', 'success');
      setStep(2);
    } catch (err) { show(err.message); }
    setLoading(false);
  };

  // ── Cadastro — Step 2: verificar código
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) { show('Digite o código de verificação.'); return; }
    setLoading(true);
    try {
      const data = await api.verifyCode(regEmail.trim(), verificationCode.trim());
      sessionStorage.setItem('angler_token', data.token);
      setToast('');
      onLogin(data.username);
    } catch (err) { show(err.message); }
    setLoading(false);
  };

  // ── Cadastro — reenviar código
  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.sendCode({ name: regName.trim(), lastName: regLastName.trim(), email: regEmail.trim(), username: regUsername.trim(), password: regPassword });
      show('Novo código enviado!', 'success');
    } catch (err) { show(err.message); }
    setLoading(false);
  };

  // ═══════════════════════════════════════════
  // ESQUECEU SENHA — Step 1: enviar código
  // ═══════════════════════════════════════════
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { show('Informe seu email.'); return; }
    setLoading(true);
    try {
      await api.forgotPassword(resetEmail.trim());
      show('Se o email estiver cadastrado, você receberá um código.', 'success');
      setStep(2);
    } catch (err) { show(err.message); }
    setLoading(false);
  };

  // ── Esqueceu senha — Step 2: redefinir
  const handleResetPassword = async () => {
    if (!resetCode.trim()) { show('Digite o código.'); return; }
    if (resetNewPass.length < 6) { show('Nova senha precisa ter pelo menos 6 caracteres.'); return; }
    if (resetNewPass !== resetConfirmPass) { show('As senhas não conferem.'); return; }
    setLoading(true);
    try {
      const data = await api.resetPassword(resetEmail.trim(), resetCode.trim(), resetNewPass);
      sessionStorage.setItem('angler_token', data.token);
      show('Senha redefinida com sucesso!', 'success');
      setTimeout(() => onLogin(data.username), 1000);
    } catch (err) { show(err.message); }
    setLoading(false);
  };

  // ═══════════════════════════════════════════
  // ESQUECEU USUÁRIO
  // ═══════════════════════════════════════════
  const handleForgotUsername = async () => {
    if (!forgotUserEmail.trim()) { show('Informe seu email.'); return; }
    setLoading(true);
    try {
      await api.forgotUsername(forgotUserEmail.trim());
      show('Se o email estiver cadastrado, você receberá seu nome de usuário.', 'success');
      setStep(2);
    } catch (err) { show(err.message); }
    setLoading(false);
  };

  // ═══════════════════════════════════════════
  // Navegação entre views
  // ═══════════════════════════════════════════
  const goTo = (v) => {
    setView(v);
    setStep(1);
    setToast('');
    setVerificationCode('');
    setResetCode('');
    setResetNewPass('');
    setResetConfirmPass('');
  };

  const handleBack = () => {
    if (step > 1) { setStep(1); setToast(''); return; }
    if (view !== 'login') { goTo('login'); return; }
    history.push('/');
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* ── Botão voltar ── */}
        <button onClick={handleBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15, marginBottom: 24,
        }}>
          <IonIcon icon={arrowBackOutline} style={{ fontSize: 18 }} />
          {step > 1 ? 'Voltar' : view === 'login' ? 'Voltar' : 'Voltar'}
        </button>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--primary), #e8a020)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'var(--bg)',
          }}>A</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Angler</h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginTop: 4 }}>
            {view === 'login' && 'Entre na sua conta'}
            {view === 'register' && (step === 1 ? 'Crie sua conta' : 'Verifique seu email')}
            {view === 'forgot' && (step === 1 ? 'Recuperar senha' : 'Redefinir senha')}
            {view === 'forgot-username' && (step === 1 ? 'Recuperar usuário' : 'Email enviado')}
          </p>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* LOGIN                                    */}
        {/* ════════════════════════════════════════ */}
        {view === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Usuário ou Email</label>
              <input type="text" value={loginInput} onChange={e => setLoginInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Seu usuário ou email" autoComplete="username" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Sua senha" autoComplete="current-password" style={inputStyle} />
            </div>
            <button className="btn btn-primary" onClick={handleLogin} disabled={loading}
              style={{ width: '100%', padding: '14px 0', marginTop: 4, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={logInOutline} style={{ fontSize: 20 }} />
              {loading ? 'Aguarde...' : 'Entrar'}
            </button>

            {/* Links */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button onClick={() => goTo('forgot')} style={linkBtn}>
                <IonIcon icon={keyOutline} style={{ fontSize: 14, verticalAlign: -2 }} /> Esqueceu a senha?
              </button>
              <button onClick={() => goTo('forgot-username')} style={linkBtn}>
                <IonIcon icon={personOutline} style={{ fontSize: 14, verticalAlign: -2 }} /> Esqueceu o usuário?
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button onClick={() => goTo('register')} style={{ ...linkBtn, fontSize: 15 }}>
                Não tem conta? <strong>Criar conta</strong>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* CADASTRO — Step 1: Dados                 */}
        {/* ════════════════════════════════════════ */}
        {view === 'register' && step === 1 && (
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
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => goTo('login')} style={{ ...linkBtn, fontSize: 15 }}>
                Já tem conta? <strong>Entrar</strong>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* CADASTRO — Step 2: Código                 */}
        {/* ════════════════════════════════════════ */}
        {view === 'register' && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(14,203,129,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
            }}>
              <IonIcon icon={mailOutline} style={{ fontSize: 32, color: 'var(--green)' }} />
            </div>
            <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Enviamos um código para<br /><strong style={{ color: 'var(--text)' }}>{regEmail}</strong>
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
            <button onClick={handleResendCode} disabled={loading} style={linkBtn}>Reenviar código</button>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ESQUECEU SENHA — Step 1: Email            */}
        {/* ════════════════════════════════════════ */}
        {view === 'forgot' && step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Informe o email cadastrado para receber um código de redefinição de senha.
            </p>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                placeholder="seu@email.com" autoComplete="email" style={inputStyle} />
            </div>
            <button className="btn btn-primary" onClick={handleForgotPassword} disabled={loading}
              style={{ width: '100%', padding: '14px 0', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={mailOutline} style={{ fontSize: 20 }} />
              {loading ? 'Aguarde...' : 'Enviar Código'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => goTo('login')} style={{ ...linkBtn, fontSize: 15 }}>
                Lembrou a senha? <strong>Entrar</strong>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ESQUECEU SENHA — Step 2: Nova senha       */}
        {/* ════════════════════════════════════════ */}
        {view === 'forgot' && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(252,213,53,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
            }}>
              <IonIcon icon={lockClosedOutline} style={{ fontSize: 32, color: 'var(--primary)' }} />
            </div>
            <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Enviamos um código para<br /><strong style={{ color: 'var(--text)' }}>{resetEmail}</strong>
            </p>
            <div>
              <label style={labelStyle}>Código de Verificação</label>
              <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace" }} />
            </div>
            <div>
              <label style={labelStyle}>Nova Senha</label>
              <input type="password" value={resetNewPass} onChange={e => setResetNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirmar Nova Senha</label>
              <input type="password" value={resetConfirmPass} onChange={e => setResetConfirmPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                placeholder="Repita a nova senha" autoComplete="new-password" style={inputStyle} />
            </div>
            <button className="btn btn-primary" onClick={handleResetPassword} disabled={loading}
              style={{ width: '100%', padding: '14px 0', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20 }} />
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button onClick={handleForgotPassword} disabled={loading} style={linkBtn}>Reenviar código</button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ESQUECEU USUÁRIO — Step 1: Email          */}
        {/* ════════════════════════════════════════ */}
        {view === 'forgot-username' && step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Informe o email cadastrado para receber seu nome de usuário.
            </p>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={forgotUserEmail} onChange={e => setForgotUserEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotUsername()}
                placeholder="seu@email.com" autoComplete="email" style={inputStyle} />
            </div>
            <button className="btn btn-primary" onClick={handleForgotUsername} disabled={loading}
              style={{ width: '100%', padding: '14px 0', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={mailOutline} style={{ fontSize: 20 }} />
              {loading ? 'Aguarde...' : 'Enviar Nome de Usuário'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => goTo('login')} style={{ ...linkBtn, fontSize: 15 }}>
                Lembrou o usuário? <strong>Entrar</strong>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ESQUECEU USUÁRIO — Step 2: Sucesso        */}
        {/* ════════════════════════════════════════ */}
        {view === 'forgot-username' && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(14,203,129,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
            }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 32, color: 'var(--green)' }} />
            </div>
            <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Se <strong style={{ color: 'var(--text)' }}>{forgotUserEmail}</strong> estiver cadastrado,
              você receberá seu nome de usuário por email.
            </p>
            <button className="btn btn-primary" onClick={() => goTo('login')}
              style={{ width: '100%', padding: '14px 0', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IonIcon icon={logInOutline} style={{ fontSize: 20 }} />
              Ir para Login
            </button>
          </div>
        )}
      </div>

      <IonToast isOpen={!!toast} onDidDismiss={() => setToast('')} message={toast} duration={4000} color={toastColor} position="bottom" />
    </div>
  );
}
