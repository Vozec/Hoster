const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const allowed = process.env.API_KEY
      ? process.env.API_KEY.split(',').map((k) => k.trim())
      : [];
    if (allowed.includes(apiKey)) {
      req.user = { source: 'apiKey' };
      return next();
    }
    return res.status(403).json({ message: 'Invalid API key' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
};

module.exports = adminAuth;
