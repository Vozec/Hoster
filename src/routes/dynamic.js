const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { logRouteAccess } = require('../middlewares/logger');
const Route = require('../models/Route');

// Middleware pour charger toutes les routes dynamiques
const loadDynamicRoutes = async (req, res, next) => {
  try {
    // Cette fonction est appelée au démarrage du serveur
    // et recharge les routes depuis la base de données
    console.log('Chargement des routes dynamiques...');
    next();
  } catch (error) {
    console.error('Erreur lors du chargement des routes dynamiques:', error);
    next(error);
  }
};

// Initialiser le chargement des routes
router.use(loadDynamicRoutes);

// Route générique pour servir le contenu des routes dynamiques
router.all('*', logRouteAccess, routeController.serveRouteContent);

// Fonction pour recharger les routes dynamiques dans l'application Express
const refreshDynamicRoutes = async (app) => {
  try {
    // Récupérer toutes les routes depuis la base de données
    const routes = await Route.find().sort({ path: 1 });
    
    // Créer un middleware pour gérer toutes les routes dynamiques
    app.use('/', (req, res, next) => {
      // Extraire le chemin de base sans les paramètres de requête
      const fullPath = req.originalUrl;
      const basePath = fullPath.split('?')[0];
      
      console.log(`Recherche de route dynamique pour: ${basePath} (URL complète: ${fullPath})`);
      
      // Vérifier si la route existe dans notre liste
      const route = routes.find(r => r.path === basePath);
      
      if (route) {
        console.log(`Route dynamique trouvée: ${route.path}, type: ${route.contentType}`);
        
        // Enregistrer l'accès
        logRouteAccess(req, res, () => {});
        
        // Si c'est du PHP, utiliser l'évaluateur PHP
        if (route.contentType && route.contentType.toLowerCase().includes('php')) {
          console.log('Contenu PHP détecté, évaluation du code...');
          const evaluatePhp = require('../utils/phpEvaluator');
          return evaluatePhp(route.content, req, res);
        }
        
        // Pour les autres types de contenu
        res.setHeader('Content-Type', route.contentType);
        return res.send(route.content);
      }
      
      // Si la route n'est pas trouvée, passer au middleware suivant
      next();
    });
    
    console.log(`${routes.length} routes dynamiques chargées`);
  } catch (error) {
    console.error('Erreur lors du rechargement des routes dynamiques:', error);
  }
};

module.exports = {
  router,
  refreshDynamicRoutes
};
