const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../config/db');

const router = express.Router();

// GET — ler seção
router.get('/*section', auth, async (req, res) => {
  try {
    const section = req.params.section;
    if (!section) return res.status(400).json({ error: 'Seção não informada.' });

    const db = getDb();
    const doc = await db.collection('user_data').findOne({ username: req.username, section });

    console.log(`[DATA] GET ${section} por ${req.username} → ${doc ? 'encontrado' : 'vazio'}`);
    res.json(doc?.data || null);
  } catch (err) {
    console.error('[DATA] GET erro:', err.message);
    res.status(500).json({ error: 'Erro ao carregar dados.' });
  }
});

// PUT — salvar seção
router.put('/*section', auth, async (req, res) => {
  try {
    const section = req.params.section;
    if (!section) return res.status(400).json({ error: 'Seção não informada.' });

    const db = getDb();
    await db.collection('user_data').updateOne(
      { username: req.username, section },
      { $set: { data: req.body.data, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`[DATA] PUT ${section} por ${req.username} → salvo (${JSON.stringify(req.body.data).length} bytes)`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DATA] PUT erro:', err.message);
    res.status(500).json({ error: 'Erro ao salvar dados.' });
  }
});

// DELETE — remover seção
router.delete('/*section', auth, async (req, res) => {
  try {
    const section = req.params.section;
    const db = getDb();
    await db.collection('user_data').deleteOne({ username: req.username, section });
    console.log(`[DATA] DELETE ${section} por ${req.username}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DATA] DELETE erro:', err.message);
    res.status(500).json({ error: 'Erro ao remover dados.' });
  }
});

module.exports = router;
