const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

// Salvar chave API (criptografada)
router.put('/config', auth, async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const db = getDb();

    const data = {};
    if (apiKey !== undefined) data.encryptedKey = apiKey ? encrypt(apiKey) : '';
    if (model !== undefined) data.model = model;

    await db.collection('user_data').updateOne(
      { username: req.username, section: 'ia/config' },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configuração.' });
  }
});

// Ler config (retorna chave descriptografada para uso do frontend)
router.get('/config', auth, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('user_data').findOne({ username: req.username, section: 'ia/config' });
    if (!doc?.data) return res.json({ apiKey: '', model: 'gemini-2.0-flash' });

    res.json({
      apiKey: doc.data.encryptedKey ? decrypt(doc.data.encryptedKey) : '',
      model: doc.data.model || 'gemini-2.0-flash',
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configuração.' });
  }
});

// Chat — proxy para Gemini (chave nunca sai do servidor)
router.post('/chat', auth, async (req, res) => {
  try {
    const { messages, model } = req.body;
    const db = getDb();

    // Buscar chave criptografada
    const config = await db.collection('user_data').findOne({ username: req.username, section: 'ia/config' });
    const apiKey = config?.data?.encryptedKey ? decrypt(config.data.encryptedKey) : '';
    if (!apiKey) return res.status(400).json({ error: 'Configure a chave do Gemini nas Configurações.' });

    const useModel = model || config?.data?.model || 'gemini-2.0-flash';

    // Chamar Gemini
    const systemMsg = messages.find(m => m.role === 'system');
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const body = { contents };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const errMsg = err.error?.message || `Erro ${resp.status}`;

      // Friendly errors
      if (errMsg.includes('quota') || errMsg.includes('429')) {
        return res.status(429).json({ error: 'Limite de uso atingido. Aguarde 1 minuto e tente de novo.' });
      }
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        return res.status(400).json({ error: 'Modelo não disponível. Atualize a lista de modelos nas Configurações.' });
      }
      if (errMsg.includes('high demand') || errMsg.includes('503')) {
        return res.status(503).json({ error: 'Muita gente usando agora. Espere 1 minutinho.' });
      }
      return res.status(400).json({ error: errMsg });
    }

    const data = await resp.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Salvar no histórico
    await db.collection('user_data').updateOne(
      { username: req.username, section: 'ia/history' },
      {
        $push: {
          'data.messages': {
            $each: [
              { role: 'user', content: messages[messages.length - 1].content, ts: new Date() },
              { role: 'assistant', content: reply, source: 'gemini', model: useModel, ts: new Date() },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    res.json({ reply, model: useModel });
  } catch (err) {
    res.status(500).json({ error: 'Erro de conexão. Verifique sua internet.' });
  }
});

// Buscar histórico
router.get('/history', auth, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('user_data').findOne({ username: req.username, section: 'ia/history' });
    res.json(doc?.data?.messages || []);
  } catch {
    res.json([]);
  }
});

// Limpar histórico
router.delete('/history', auth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('user_data').updateOne(
      { username: req.username, section: 'ia/history' },
      { $set: { data: { messages: [] }, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao limpar histórico.' });
  }
});

// Listar modelos do Gemini
router.get('/models', auth, async (req, res) => {
  try {
    const db = getDb();
    const config = await db.collection('user_data').findOne({ username: req.username, section: 'ia/config' });
    const apiKey = config?.data?.encryptedKey ? decrypt(config.data.encryptedKey) : '';
    if (!apiKey) return res.json({ models: ['gemini-2.0-flash'] });

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!r.ok) return res.json({ models: ['gemini-2.0-flash'] });

    const data = await r.json();
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .sort();

    res.json({ models: models.length > 0 ? models : ['gemini-2.0-flash'] });
  } catch {
    res.json({ models: ['gemini-2.0-flash'] });
  }
});

module.exports = router;