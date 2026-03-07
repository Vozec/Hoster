const Route = require('../models/Route');
const AccessLog = require('../models/AccessLog');
const evaluatePhp = require('../utils/phpEvaluator');
const crypto = require('crypto');
const { normalizePath } = require('../utils/pathUtils');

function generateRandomSlug(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

const createRoute = async (req, res) => {
  try {
    let {
      path,
      name,
      contentType,
      contentEncoding,
      content,
      category,
      tags,
      corsConfig,
      customHeaders,
      fileName,
      contentDisposition,
      rateLimit,
    } = req.body;

    if (!contentType) {
      return res.status(400).json({ message: 'Content type is required' });
    }
    if (content === undefined || content === null) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (!path || path.trim() === '') {
      const randomId = generateRandomSlug(8);
      path = `/${randomId}`;
      category = category || 'temporary';
      if (!name || name.trim() === '') {
        name = randomId;
      }
    } else {
      path = normalizePath(path.trim());
    }

    if (!name || name.trim() === '') {
      name =
        path === '/'
          ? 'Default Route'
          : path
              .split('/')
              .filter(Boolean)
              .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
              .join(' ');
    }

    const existingRoute = await Route.findOne({ path });
    if (existingRoute) {
      return res.status(400).json({ message: 'A route with this path already exists' });
    }

    const now = new Date();
    const isTemporary = (category || 'classic') === 'temporary';
    const newRoute = new Route({
      path,
      name: name.trim(),
      contentType,
      contentEncoding: contentEncoding || 'text',
      content,
      category: category || 'classic',
      temporarySince: isTemporary ? now : null,
      tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
      corsConfig: corsConfig || {
        enabled: false,
        allowOrigin: '*',
        allowMethods: 'GET,POST,OPTIONS,DELETE,PUT',
        allowHeaders: '*',
      },
      customHeaders: Array.isArray(customHeaders) ? customHeaders.filter((h) => h.key) : [],
      fileName: fileName || '',
      contentDisposition: contentDisposition || '',
      rateLimit: rateLimit || { enabled: false, maxRequests: 60, windowMs: 60000 },
    });

    await newRoute.save();
    res.status(201).json({ message: 'Route created successfully', route: newRoute });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const { category, search, tag } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchLower = { $regex: escaped, $options: 'i' };
      query.$or = [
        { name: searchLower },
        { path: searchLower },
        { contentType: searchLower },
        { content: searchLower },
        { tags: searchLower },
      ];
    }

    const routes = await Route.find(query).sort({ path: 1 });
    res.json(routes);
  } catch (error) {
    console.error('Error retrieving routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

const updateRoute = async (req, res) => {
  try {
    let {
      path,
      name,
      contentType,
      contentEncoding,
      content,
      category,
      tags,
      corsConfig,
      customHeaders,
      fileName,
      contentDisposition,
      rateLimit,
    } = req.body;

    if (path) {
      path = normalizePath(path.trim());
      const existingRoute = await Route.findOne({ path, _id: { $ne: req.params.id } });
      if (existingRoute) {
        return res.status(400).json({ message: 'A route with this path already exists' });
      }
    }

    const oldRoute = await Route.findById(req.params.id);
    if (!oldRoute) {
      return res.status(404).json({ message: 'Route not found' });
    }

    let updateFields = {
      updatedAt: Date.now(),
    };

    if (path !== undefined) updateFields.path = path;
    if (name !== undefined) updateFields.name = name;
    if (contentType !== undefined) updateFields.contentType = contentType;
    if (contentEncoding !== undefined) updateFields.contentEncoding = contentEncoding;
    if (content !== undefined) updateFields.content = content;
    if (tags !== undefined)
      updateFields.tags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [];
    if (corsConfig !== undefined) updateFields.corsConfig = corsConfig;
    if (customHeaders !== undefined)
      updateFields.customHeaders = Array.isArray(customHeaders)
        ? customHeaders.filter((h) => h.key)
        : [];
    if (fileName !== undefined) updateFields.fileName = fileName;
    if (contentDisposition !== undefined) updateFields.contentDisposition = contentDisposition;
    if (rateLimit !== undefined) updateFields.rateLimit = rateLimit;

    if (category !== undefined) {
      updateFields.category = category;
      if (oldRoute.category === 'classic' && category === 'temporary') {
        updateFields.temporarySince = new Date();
      } else if (oldRoute.category === 'temporary' && category === 'classic') {
        updateFields.temporarySince = null;
      }
    }

    const updatedRoute = await Route.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.json({ message: 'Route updated successfully', route: updatedRoute });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    if (!deletedRoute) {
      return res.status(404).json({ message: 'Route not found' });
    }
    await AccessLog.deleteMany({ routeId: req.params.id });
    res.json({ message: 'Route deleted successfully', route: deletedRoute });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const cloneRoute = async (req, res) => {
  try {
    const sourceRoute = await Route.findById(req.params.id);
    if (!sourceRoute) {
      return res.status(404).json({ message: 'Route not found' });
    }

    let newPath;
    if (req.body && req.body.targetPath && req.body.targetPath.trim()) {
      newPath = normalizePath(req.body.targetPath.trim());
      const existing = await Route.findOne({ path: newPath });
      if (existing) {
        return res.status(400).json({ message: 'A route with this path already exists' });
      }
    } else {
      newPath = `/${generateRandomSlug(8)}`;
    }

    const newRoute = new Route({
      path: newPath,
      name: `${sourceRoute.name} (copy)`,
      contentType: sourceRoute.contentType,
      contentEncoding: sourceRoute.contentEncoding,
      content: sourceRoute.content,
      category: sourceRoute.category,
      tags: [...sourceRoute.tags],
      corsConfig: { ...sourceRoute.corsConfig },
      customHeaders: (sourceRoute.customHeaders || []).map((h) => ({ key: h.key, value: h.value })),
      fileName: sourceRoute.fileName || '',
      contentDisposition: sourceRoute.contentDisposition || '',
      temporarySince: sourceRoute.category === 'temporary' ? new Date() : null,
      rateLimit: sourceRoute.rateLimit
        ? { ...sourceRoute.rateLimit.toObject() }
        : { enabled: false, maxRequests: 60, windowMs: 60000 },
    });

    await newRoute.save();
    res.status(201).json({ message: 'Route cloned successfully', route: newRoute });
  } catch (error) {
    console.error('Error cloning route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

const deleteMultipleRoutes = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No route IDs provided' });
    }
    const result = await Route.deleteMany({ _id: { $in: ids } });
    await AccessLog.deleteMany({ routeId: { $in: ids } });
    res.json({
      message: `${result.deletedCount} routes deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting multiple routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const serveRouteContent = async (req, res) => {
  try {
    let path = req.originalUrl;
    const route = await Route.findOne({ path });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (route.contentType.toLowerCase().includes('php')) {
      try {
        return await evaluatePhp(route.content, req, res);
      } catch (phpError) {
        console.error("Erreur lors de l'évaluation PHP:", phpError);
        if (!res.headersSent) {
          return res.status(500).send(`<pre>PHP Evaluation Error: ${phpError.message}</pre>`);
        }
      }
    } else {
      res.setHeader('Content-Type', route.contentType);
      if (route.contentEncoding === 'base64') {
        return res.end(Buffer.from(route.content, 'base64'));
      } else if (route.contentEncoding === 'hex') {
        return res.end(Buffer.from(route.content, 'hex'));
      }
      res.send(route.content);
    }
  } catch (error) {
    console.error('Error serving route:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  cloneRoute,
  deleteMultipleRoutes,
  getRouteLogs,
  serveRouteContent,
};
