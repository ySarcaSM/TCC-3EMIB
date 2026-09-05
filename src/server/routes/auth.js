const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getDb } = require('../config/db');

const router = express.Router();

// ─── Email transporter ───
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── Gerar código de 6 dígitos ───
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Template base de email ───
function emailTemplate(title, message, codeOrContent, extra = '') {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b0e11; border-radius: 12px; border: 1px solid #2b3139;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; background: #fcd535; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #181a20;">A</div>
      </div>
      <h2 style="color: #eaecef; text-align: center; font-size: 20px; margin-bottom: 8px;">${title}</h2>
      <p style="color: #707a8a; text-align: center; font-size: 14px; margin-bottom: 24px;">${message}</p>
      ${codeOrContent}
      ${extra}
      <p style="color: #707a8a; text-align: center; font-size: 12px;">Este email expira em 10 minutos. Se você não solicitou, ignore-o.</p>
    </div>
  `;
}

function codeBlock(code) {
  return `<div style="background: #1e2329; border: 2px solid #fcd535; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
    <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fcd535; font-family: 'DM Mono', monospace;">${code}</span>
  </div>`;
}

function textBlock(text) {
  return `<div style="background: #1e2329; border: 1px solid #2b3139; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
    <span style="font-size: 20px; font-weight: 700; color: #eaecef; font-family: 'DM Mono', monospace;">${text}</span>
  </div>`;
}

// ─── Enviar email genérico ───
async function sendEmail(to, subject, html) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

// ─── Seed admin user ───
async function seedAdmin() {
  try {
    const db = getDb();
    const existing = await db.collection('users').findOne({ username: 'admin' });
    if (!existing) {
      const passwordHash = await bcrypt.hash('Y&rXyQIrl7RcbHo0i39$ja%T', 10);
      await db.collection('users').insertOne({
        username: 'admin',
        email: 'admin@angler.com',
        name: 'Administrador',
        lastName: 'Angler',
        passwordHash,
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
      });
      console.log('[SEED] Usuário admin criado com sucesso.');
    }
  } catch (err) {
    console.error('[SEED] Erro ao criar admin:', err.message);
  }
}

// ══════════════════════════════════════════════════
// ROTAS DE CADASTRO
// ══════════════════════════════════════════════════

// ─── POST /api/auth/send-code ───
router.post('/send-code', async (req, res) => {
  try {
    const { email, name, lastName, username, password } = req.body;

    if (!email || !name || !lastName || !username || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Usuário precisa ter pelo menos 3 caracteres.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha precisa ter pelo menos 6 caracteres.' });
    }
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    const db = getDb();

    const existsUser = await db.collection('users').findOne({ username });
    if (existsUser) return res.status(400).json({ error: 'Esse usuário já existe. Escolha outro.' });

    const existsEmail = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existsEmail) return res.status(400).json({ error: 'Esse email já está cadastrado.' });

    const pending = await db.collection('verification_codes').findOne({ email: email.toLowerCase(), purpose: 'register' });
    if (pending && (Date.now() - pending.createdAt.getTime()) < 60000) {
      return res.status(429).json({ error: 'Aguarde 1 minuto antes de solicitar outro código.' });
    }

    const code = generateCode();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.collection('verification_codes').updateOne(
      { email: email.toLowerCase(), purpose: 'register' },
      {
        $set: {
          email: email.toLowerCase(),
          purpose: 'register',
          code,
          name,
          lastName,
          username,
          passwordHash,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
      { upsert: true }
    );

    const html = emailTemplate(
      'Verificação de Email',
      'Use o código abaixo para verificar seu email e criar sua conta:',
      codeBlock(code)
    );
    await sendEmail(email, 'Angler — Código de Verificação', html);

    res.json({ ok: true, message: 'Código enviado para seu email.' });
  } catch (err) {
    console.error('[send-code] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao enviar código. Verifique as configurações de email.' });
  }
});

// ─── POST /api/auth/verify-code ───
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Preencha o código de verificação.' });
    }

    const db = getDb();
    const record = await db.collection('verification_codes').findOne({ email: email.toLowerCase(), purpose: 'register' });

    if (!record) {
      return res.status(400).json({ error: 'Nenhum código pendente para este email. Solicite um novo.' });
    }

    if (new Date() > record.expiresAt) {
      await db.collection('verification_codes').deleteOne({ email: email.toLowerCase(), purpose: 'register' });
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: 'Código incorreto. Tente novamente.' });
    }

    await db.collection('users').insertOne({
      username: record.username,
      email: record.email,
      name: record.name,
      lastName: record.lastName,
      passwordHash: record.passwordHash,
      role: 'user',
      emailVerified: true,
      createdAt: new Date(),
    });

    await db.collection('verification_codes').deleteOne({ email: email.toLowerCase(), purpose: 'register' });

    const token = jwt.sign(
      { username: record.username, name: record.name },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, username: record.username, name: record.name });
  } catch (err) {
    console.error('[verify-code] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao verificar código. Tente novamente.' });
  }
});

// ══════════════════════════════════════════════════
// ROTA DE LOGIN (aceita username OU email)
// ══════════════════════════════════════════════════

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha usuário/email e senha.' });

    const db = getDb();

    // Buscar por username OU email
    const user = await db.collection('users').findOne({
      $or: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() },
      ],
    });

    if (!user) return res.status(401).json({ error: 'Usuário ou email não encontrado.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta.' });

    const token = jwt.sign(
      { username: user.username, name: user.name || user.username },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, username: user.username, name: user.name || user.username });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login. Tente novamente.' });
  }
});

// ══════════════════════════════════════════════════
// ESQUECEU SENHA
// ══════════════════════════════════════════════════

// ─── POST /api/auth/forgot-password ───
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Informe seu email.' });

    const db = getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    if (!user) {
      return res.json({ ok: true, message: 'Se este email estiver cadastrado, você receberá um código.' });
    }

    // Rate limit
    const pending = await db.collection('verification_codes').findOne({ email: email.toLowerCase(), purpose: 'reset-password' });
    if (pending && (Date.now() - pending.createdAt.getTime()) < 60000) {
      return res.status(429).json({ error: 'Aguarde 1 minuto antes de solicitar outro código.' });
    }

    const code = generateCode();

    await db.collection('verification_codes').updateOne(
      { email: email.toLowerCase(), purpose: 'reset-password' },
      {
        $set: {
          email: email.toLowerCase(),
          purpose: 'reset-password',
          code,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
      { upsert: true }
    );

    const html = emailTemplate(
      'Redefinição de Senha',
      'Use o código abaixo para redefinir sua senha:',
      codeBlock(code)
    );
    await sendEmail(email, 'Angler — Redefinição de Senha', html);

    res.json({ ok: true, message: 'Se este email estiver cadastrado, você receberá um código.' });
  } catch (err) {
    console.error('[forgot-password] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao enviar código. Tente novamente.' });
  }
});

// ─── POST /api/auth/reset-password ───
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha precisa ter pelo menos 6 caracteres.' });
    }

    const db = getDb();
    const record = await db.collection('verification_codes').findOne({ email: email.toLowerCase(), purpose: 'reset-password' });

    if (!record) {
      return res.status(400).json({ error: 'Nenhum código pendente. Solicite um novo.' });
    }

    if (new Date() > record.expiresAt) {
      await db.collection('verification_codes').deleteOne({ email: email.toLowerCase(), purpose: 'reset-password' });
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: 'Código incorreto.' });
    }

    // Atualizar senha
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { passwordHash } }
    );

    // Limpar código
    await db.collection('verification_codes').deleteOne({ email: email.toLowerCase(), purpose: 'reset-password' });

    // Buscar usuário para gerar token
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    const token = jwt.sign(
      { username: user.username, name: user.name || user.username },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ ok: true, message: 'Senha redefinida com sucesso!', token, username: user.username });
  } catch (err) {
    console.error('[reset-password] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao redefinir senha. Tente novamente.' });
  }
});

// ══════════════════════════════════════════════════
// ESQUECEU USUÁRIO
// ══════════════════════════════════════════════════

// ─── POST /api/auth/forgot-username ───
router.post('/forgot-username', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Informe seu email.' });

    const db = getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    // Por segurança, sempre retorna sucesso
    if (!user) {
      return res.json({ ok: true, message: 'Se este email estiver cadastrado, você receberá seu nome de usuário.' });
    }

    // Rate limit
    const pending = await db.collection('verification_codes').findOne({ email: email.toLowerCase(), purpose: 'forgot-username' });
    if (pending && (Date.now() - pending.createdAt.getTime()) < 60000) {
      return res.status(429).json({ error: 'Aguarde 1 minuto antes de solicitar novamente.' });
    }

    // Salvar registro de envio
    await db.collection('verification_codes').updateOne(
      { email: email.toLowerCase(), purpose: 'forgot-username' },
      {
        $set: {
          email: email.toLowerCase(),
          purpose: 'forgot-username',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
      { upsert: true }
    );

    const html = emailTemplate(
      'Recuperação de Usuário',
      'Seu nome de usuário no Angler é:',
      textBlock(user.username)
    );
    await sendEmail(email, 'Angler — Seu Nome de Usuário', html);

    res.json({ ok: true, message: 'Se este email estiver cadastrado, você receberá seu nome de usuário.' });
  } catch (err) {
    console.error('[forgot-username] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao enviar email. Tente novamente.' });
  }
});

// ══════════════════════════════════════════════════
// VERIFICAÇÃO DE TOKEN
// ══════════════════════════════════════════════════

router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Sem token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ username: decoded.username, name: decoded.name });
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
});

module.exports = router;
module.exports.seedAdmin = seedAdmin;
