const Route = require('../models/Route');
const AccessLog = require('../models/AccessLog');
const evaluatePhp = require('../utils/phpEvaluator');

// Créer une nouvelle route
const createRoute = async (req, res) => {
  try {
    let { path, name, contentType, content, category } = req.body;
    
    // Générer un chemin aléatoire si aucun chemin n'est fourni
    if (!path || path.trim() === '') {
      // Générer un identifiant aléatoire
      const randomId = Math.random().toString(36).substring(2, 10);
      path = `/tmp-${randomId}`;
      category = 'temporary';
      
      // Si aucun nom n'est fourni, utiliser tmp-randomId
      if (!name || name.trim() === '') {
        name = `tmp-${randomId}`;
      }
    } else {
      // S'assurer que le chemin commence par /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
    }

    // Vérifier si la route existe déjà
    const existingRoute = await Route.findOne({ path });
    if (existingRoute) {
      return res.status(400).json({ message: 'This route already exists' });
    }

    // Créer la nouvelle route
    const newRoute = new Route({
      path,
      name,
      contentType,
      content,
      category: category || 'classic'
    });

    await newRoute.save();

    res.status(201).json({
      message: 'Route created successfully',
      route: newRoute
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    // Construire la requête de filtrage
    let query = {};
    
    // Filtrer par catégorie si spécifié
    if (category) {
      query.category = category;
    }
    
    // Recherche par nom ou chemin
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } }
      ];
    }
    
    const routes = await Route.find(query).sort({ path: 1 });
    res.json(routes);
  } catch (error) {
    console.error('Error retrieving routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a route by its ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    res.json(route);
  } catch (error) {
    console.error('Error retrieving route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a route
const updateRoute = async (req, res) => {
  try {
    const { path, name, contentType, content, category } = req.body;
    
    // Vérifier si la nouvelle route existe déjà (sauf si c'est la même)
    if (path) {
      const existingRoute = await Route.findOne({ 
        path, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingRoute) {
        return res.status(400).json({ message: 'This route already exists' });
      }
    }
    
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      { path, name, contentType, content, category, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedRoute) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    res.json({
      message: 'Route updated successfully',
      route: updatedRoute
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a route
const deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    
    if (!deletedRoute) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Supprimer également les logs associés
    await AccessLog.deleteMany({ routeId: req.params.id });
    
    res.json({
      message: 'Route deleted successfully',
      route: deletedRoute
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get access logs for a specific route
const getRouteLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find({ routeId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json(logs);
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Serve dynamic route content
const serveRouteContent = async (req, res) => {
  try {
    // Get the request path
    let path = req.originalUrl;
    
    // Search for the route in the database
    const route = await Route.findOne({ path });
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Si le type de contenu contient PHP, évaluer le code PHP avec le serveur PHP intégré
    if (route.contentType.toLowerCase().includes('php')) {
      try {
        console.log('Évaluation du code PHP pour la route:', route.path);
        // Passer req et res directement à l'évaluateur PHP
        return await evaluatePhp(route.content, req, res);
      } catch (phpError) {
        console.error('Erreur lors de l\'évaluation PHP:', phpError);
        if (!res.headersSent) {
          return res.status(500).send(`<pre>PHP Evaluation Error: ${phpError.message}</pre>`);
        }
      }
    } else {
      // Pour les autres types de contenu, servir normalement
      res.setHeader('Content-Type', route.contentType);
      res.send(route.content);
    }
  } catch (error) {
    console.error('Error serving route:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Supprimer plusieurs routes
const deleteMultipleRoutes = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No route IDs provided' });
    }
    
    // Supprimer les routes
    const result = await Route.deleteMany({ _id: { $in: ids } });
    
    // Supprimer également les logs associés
    await AccessLog.deleteMany({ routeId: { $in: ids } });
    
    res.json({
      message: `${result.deletedCount} routes deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting multiple routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  deleteMultipleRoutes,
  getRouteLogs,
  serveRouteContent
};
