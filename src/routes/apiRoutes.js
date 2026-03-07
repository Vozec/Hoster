const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const adminController = require('../controllers/adminController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');

router.use(apiKeyAuth);

router.post('/routes', routeController.createRoute);
router.get('/routes', routeController.getAllRoutes);
router.get('/routes/:id', routeController.getRouteById);
router.put('/routes/:id', routeController.updateRoute);
router.delete('/routes/:id', routeController.deleteRoute);
router.post('/routes/delete-multiple', routeController.deleteMultipleRoutes);
router.get('/routes/:id/logs', routeController.getRouteLogs);

router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getAllLogs);

module.exports = router;
