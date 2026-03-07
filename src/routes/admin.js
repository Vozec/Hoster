const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const adminController = require('../controllers/adminController');

router.post('/routes', routeController.createRoute);
router.get('/routes', routeController.getAllRoutes);
router.get('/routes/export', adminController.exportRoutes);
router.post('/routes/import', adminController.importRoutes);
router.post('/routes/delete-multiple', routeController.deleteMultipleRoutes);
router.get('/routes/:id', routeController.getRouteById);
router.put('/routes/:id', routeController.updateRoute);
router.delete('/routes/:id', routeController.deleteRoute);
router.post('/routes/:id/clone', routeController.cloneRoute);
router.get('/routes/:id/logs', routeController.getRouteLogs);

router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getAllLogs);

router.get('/cors-config', adminController.getCorsConfig);
router.put('/cors-config', adminController.updateCorsConfig);

router.get('/custom-headers-config', adminController.getCustomHeadersConfig);
router.put('/custom-headers-config', adminController.updateCustomHeadersConfig);

module.exports = router;
