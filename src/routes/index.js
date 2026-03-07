const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', (req, res) => {
  res.json({ message: 'API fonctionnelle' });
});

router.post('/auth/login', authController.login);
router.get('/auth/verify', authController.verifyToken);

router.get('/config', (req, res) => {
  res.json({
    adminPath: process.env.ADMIN_PATH || '/manager',
    apiPath: process.env.API_PATH || '/api',
  });
});

module.exports = router;
