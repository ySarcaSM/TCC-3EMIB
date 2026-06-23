const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../config/db');

const router = express.Router();

// GET — ler seção
router.get('/*', auth, async (req, res) => {
  try {
    const section = req.params[0];
    if (!section) return res.status(400).json({ error: 'Seção não informada.' });

    const db = getDb();
    const doc = await db.collection('user_data').findOne({ username: req.username, section });

    res.json(doc?.data || null);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dados.' });
  }
});

// PUT — salvar seção
router.put('/*', auth, async (req, res) => {
  try {
    const section = req.params[0];
    if (!section) return res.status(400).json({ error: 'Seção não informada.' });

    const db = getDb();
    await db.collection('user_data').updateOne(
      { username: req.username, section },
      { $set: { data: req.body.data, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar dados.' });
  }
});

// DELETE — remover seção
router.delete('/*', auth, async (req, res) => {
  try {
    const section = req.params[0];
    const db = getDb();
    await db.collection('user_data').deleteOne({ username: req.username, section });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover dados.' });
  }
});

module.exports = router;