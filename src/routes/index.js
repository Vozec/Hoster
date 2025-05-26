const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route de base pour vérifier que l'API fonctionne
router.get('/', (req, res) => {
  res.json({ message: 'API fonctionnelle' });
});

// Routes d'authentification
router.post('/auth/login', authController.login);
router.get('/auth/verify', authController.verifyToken);

// Endpoint pour obtenir la configuration
router.get('/config', (req, res) => {
  res.json({
    adminPath: process.env.ADMIN_PATH || '/manager',
    apiPath: process.env.API_PATH || '/api'
  });
});

module.exports = router;
