require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/api/ia', require('./routes/ia'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Iniciar
const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
}).catch(err => {
  console.error('Erro ao conectar MongoDB:', err.message);
  console.log('Verifique se o MongoDB está rodando.');
  process.exit(1);
});