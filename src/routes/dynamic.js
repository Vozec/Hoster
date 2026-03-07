const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { logRouteAccess } = require('../middlewares/logger');
const Route = require('../models/Route');

const loadDynamicRoutes = async (req, res, next) => {
  try {
    console.log('Chargement des routes dynamiques...');
    next();
  } catch (error) {
    console.error('Erreur lors du chargement des routes dynamiques:', error);
    next(error);
  }
};

router.use(loadDynamicRoutes);

router.all('*', logRouteAccess, routeController.serveRouteContent);

const refreshDynamicRoutes = async (app) => {
  try {
    const routes = await Route.find().sort({ path: 1 });

    app.use('/', (req, res, next) => {
      const fullPath = req.originalUrl;
      const basePath = fullPath.split('?')[0];

      console.log(`Recherche de route dynamique pour: ${basePath} (URL complète: ${fullPath})`);

      const route = routes.find((r) => r.path === basePath);

      if (route) {
        console.log(`Route dynamique trouvée: ${route.path}, type: ${route.contentType}`);

        logRouteAccess(req, res, () => {});

        if (route.contentType && route.contentType.toLowerCase().includes('php')) {
          console.log('Contenu PHP détecté, évaluation du code...');
          const evaluatePhp = require('../utils/phpEvaluator');
          return evaluatePhp(route.content, req, res);
        }

        res.setHeader('Content-Type', route.contentType);
        return res.send(route.content);
      }

      next();
    });

    console.log(`${routes.length} routes dynamiques chargées`);
  } catch (error) {
    console.error('Erreur lors du rechargement des routes dynamiques:', error);
  }
};

module.exports = {
  router,
  refreshDynamicRoutes,
};
