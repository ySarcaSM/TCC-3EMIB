const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Faça login primeiro.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.username = decoded.username;
    next();
  } catch {
    res.status(401).json({ error: 'Sua sessão expirou. Faça login novamente.' });
  }
}

module.exports = authMiddleware;
