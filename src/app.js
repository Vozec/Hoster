const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const Route = require('./models/Route');

const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/apiRoutes');
const { router: dynamicRouter, refreshDynamicRoutes } = require('./routes/dynamic');
const { authenticateToken } = require('./middlewares/auth');
const apiKeyAuth = require('./middlewares/apiKeyAuth');

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialiser le service Socket.IO
const socketService = require('./services/socketService');
const io = socketService.init(server);

const ADMIN_PATH = (process.env.ADMIN_PATH || '/manager').endsWith('/') ? (process.env.ADMIN_PATH || '/manager') : (process.env.ADMIN_PATH || '/manager') + '/';
const API_PATH = process.env.API_PATH || '/api';

// Middleware de base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging détaillé
app.use((req, res, next) => {
  console.log('\n=== Nouvelle requête ===');
  console.log('Méthode:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('=====================\n');
  next();
});

app.use(morgan('dev'));

// Routes API
app.use(API_PATH, indexRoutes);
app.use(`${API_PATH}/admin`, authenticateToken, adminRoutes);
// Utilisation du routeur dynamique intégré directement dans le middleware principal

// Routes API avec authentification par clé API
app.use(`${API_PATH}/v1`, apiRoutes);

// Servir les fichiers statiques du build React
// Utiliser une route plus spécifique pour les fichiers statiques
app.use(ADMIN_PATH, express.static(path.join(__dirname, '../admin-frontend/build')));
// Route spécifique pour le chemin sans slash final
app.use(ADMIN_PATH.slice(0, -1), express.static(path.join(__dirname, '../admin-frontend/build')));

// Middleware pour ajouter les en-têtes CORS à toutes les réponses sauf admin et API
app.use((req, res, next) => {
  const requestPath = req.originalUrl;
  
  // Ne pas ajouter les en-têtes CORS pour les routes admin et API
  if (requestPath.startsWith(API_PATH) || requestPath.startsWith(ADMIN_PATH) || requestPath === ADMIN_PATH.slice(0, -1)) {
    return next();
  }
  
  // Ajouter les en-têtes CORS pour toutes les autres routes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE,PUT');
  
  // Gérer les requêtes OPTIONS préflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware pour gérer les routes
app.use(async (req, res, next) => {
  try {
    const requestPath = req.originalUrl;
    console.log('Traitement de la route:', requestPath);
    
    // Ignorer les requêtes API
    if (requestPath.startsWith(API_PATH)) {
      console.log('Route API détectée, passage au middleware suivant');
      return next();
    }

    // Gestion des routes d'administration React
    if (requestPath.startsWith(ADMIN_PATH) || requestPath === ADMIN_PATH.slice(0, -1)) {
      console.log(`Route ${ADMIN_PATH} détectée, chemin original: ${requestPath}`);
      
      // Les fichiers statiques sont déjà gérés par express.static, donc on ne traite que les autres requêtes
      
      // Pour toutes les autres routes /manager/*, renvoyer l'index.html de React
      console.log('Renvoi de index.html pour le routage React');
      const indexPath = path.join(__dirname, '../admin-frontend/build', 'index.html');
      console.log('Chemin complet du fichier index.html:', indexPath);
      
      // Gestion spéciale pour la redirection vers la page de login
      // Si l'utilisateur accède à /manager ou /manager/ sans hash, on le redirige vers /manager/#/login
      if (requestPath === ADMIN_PATH || requestPath === ADMIN_PATH.slice(0, -1)) {
        console.log('Redirection vers la page de login avec HashRouter');
        return res.redirect(`${ADMIN_PATH}#/login`);
      }
      
      // Pour les autres routes, servir index.html pour le routage React
      try {
        console.log('Tentative de servir index.html pour le routage React');
        return res.sendFile(indexPath);
      } catch (err) {
        console.error('Erreur lors de l\'envoi du fichier index.html:', err);
        return res.status(500).send('Erreur lors du chargement de l\'interface d\'administration');
      }
    }

    // Extraire le chemin de base sans les paramètres de requête
    const basePath = requestPath.split('?')[0];
    console.log(`Recherche de route dynamique pour: ${basePath} (URL complète: ${requestPath})`);
    
    // Vérifier si une route dynamique existe
    const route = await Route.findOne({ path: basePath });
    if (route) {
      console.log('Route dynamique trouvée:', route.path);
      const { logRouteAccess } = require('./middlewares/logger');
      logRouteAccess(req, res, () => {});
      
      // Si le type de contenu contient PHP, évaluer le code PHP
      if (route.contentType && route.contentType.toLowerCase().includes('php')) {
        console.log('Contenu PHP détecté, évaluation du code...');
        try {
          const evaluatePhp = require('./utils/phpEvaluator');
          return await evaluatePhp(route.content, req, res);
        } catch (phpError) {
          console.error('Erreur lors de l\'évaluation PHP:', phpError);
          if (!res.headersSent) {
            return res.status(500).send(`<pre>PHP Evaluation Error: ${phpError.message}</pre>`);
          }
          return;
        }
      }
      
      // Pour les autres types de contenu, servir normalement
      res.type(route.contentType || 'text/plain');
      return res.end(route.content);
    }

    // Si aucune route n'est trouvée, chercher la route par défaut (/)
    const defaultRoute = await Route.findOne({ path: '/' });
    if (defaultRoute) {
      console.log('Route par défaut trouvée');
      const { logRouteAccess } = require('./middlewares/logger');
      logRouteAccess(req, res, () => {});
      
      // Contourner la vérification du content-type en utilisant res.type() et res.end()
      res.type(defaultRoute.contentType || 'text/plain');
      return res.end(defaultRoute.content);
    }

    // Si même la route par défaut n'existe pas, renvoyer une erreur 404
    console.log('Aucune route trouvée, erreur 404');
    res.status(404).send('Route not found');
  } catch (error) {
    console.error('Error processing route:', error);
    next(error);
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).send('Something broke!');
});

// Connexion à MongoDB et démarrage du serveur
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  refreshDynamicRoutes(app);
  
  // Socket.IO est configuré dans le service socketService
  
  // Démarrage du serveur HTTP avec Socket.IO
  server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT} avec Socket.IO`);
  });
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// Exporter l'application Express
module.exports = app;
