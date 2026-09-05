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

// ─── Enviar email de verificação ───
async function sendVerificationEmail(email, code) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Angler — Código de Verificação',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b0e11; border-radius: 12px; border: 1px solid #2b3139;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; background: #fcd535; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #181a20;">A</div>
        </div>
        <h2 style="color: #eaecef; text-align: center; font-size: 20px; margin-bottom: 8px;">Verificação de Email</h2>
        <p style="color: #707a8a; text-align: center; font-size: 14px; margin-bottom: 24px;">Use o código abaixo para verificar seu email:</p>
        <div style="background: #1e2329; border: 2px solid #fcd535; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fcd535; font-family: 'DM Mono', monospace;">${code}</span>
        </div>
        <p style="color: #707a8a; text-align: center; font-size: 12px;">Este código expira em 10 minutos. Se você não solicitou este email, ignore-o.</p>
      </div>
    `,
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

// ─── POST /api/auth/send-code ───
// Envia código de verificação para o email
router.post('/send-code', async (req, res) => {
  try {
    const { email, name, lastName, username, password } = req.body;

    // Validações
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

    // Verificar se username ou email já existem
    const existsUser = await db.collection('users').findOne({ username });
    if (existsUser) return res.status(400).json({ error: 'Esse usuário já existe. Escolha outro.' });

    const existsEmail = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existsEmail) return res.status(400).json({ error: 'Esse email já está cadastrado.' });

    // Verificar se já tem código pendente (evitar spam)
    const pending = await db.collection('verification_codes').findOne({ email: email.toLowerCase() });
    if (pending && (Date.now() - pending.createdAt.getTime()) < 60000) {
      return res.status(429).json({ error: 'Aguarde 1 minuto antes de solicitar outro código.' });
    }

    // Gerar e salvar código
    const code = generateCode();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.collection('verification_codes').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          email: email.toLowerCase(),
          code,
          name,
          lastName,
          username,
          passwordHash,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        },
      },
      { upsert: true }
    );

    // Enviar email
    await sendVerificationEmail(email, code);

    res.json({ ok: true, message: 'Código enviado para seu email.' });
  } catch (err) {
    console.error('[send-code] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao enviar código. Verifique as configurações de email.' });
  }
});

// ─── POST /api/auth/verify-code ───
// Verifica o código e cria a conta
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Preencha o código de verificação.' });
    }

    const db = getDb();
    const record = await db.collection('verification_codes').findOne({ email: email.toLowerCase() });

    if (!record) {
      return res.status(400).json({ error: 'Nenhum código pendente para este email. Solicite um novo.' });
    }

    if (new Date() > record.expiresAt) {
      await db.collection('verification_codes').deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: 'Código incorreto. Tente novamente.' });
    }

    // Código correto — criar usuário
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

    // Limpar código
    await db.collection('verification_codes').deleteOne({ email: email.toLowerCase() });

    // Gerar token (sessão — expira em 12h, sem persistência)
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

// ─── POST /api/auth/login ───
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha usuário e senha.' });

    const db = getDb();
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta.' });

    // Token de sessão (12h)
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

// ─── GET /api/auth/verify ───
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
