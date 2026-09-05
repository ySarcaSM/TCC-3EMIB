const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');

const router = express.Router();

// Seed admin user on startup
async function seedAdmin() {
  try {
    const db = getDb();
    const existing = await db.collection('users').findOne({ username: 'admin' });
    if (!existing) {
      const passwordHash = await bcrypt.hash('Y&rXyQIrl7RcbHo0i39$ja%T', 10);
      await db.collection('users').insertOne({
        username: 'admin',
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
      });
      console.log('[SEED] Usuário admin criado com sucesso.');
    }
  } catch (err) {
    console.error('[SEED] Erro ao criar admin:', err.message);
  }
}

// Registrar
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha usuário e senha.' });
    if (username.length < 3) return res.status(400).json({ error: 'Usuário precisa ter pelo menos 3 letras.' });
    if (password.length < 4) return res.status(400).json({ error: 'Senha precisa ter pelo menos 4 caracteres.' });

    const db = getDb();
    const exists = await db.collection('users').findOne({ username });
    if (exists) return res.status(400).json({ error: 'Esse usuário já existe. Escolha outro.' });

    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection('users').insertOne({ username, passwordHash, createdAt: new Date() });

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha usuário e senha.' });

    const db = getDb();
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta.' });

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login. Tente novamente.' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Sem token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ username: decoded.username });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
module.exports.seedAdmin = seedAdmin;
