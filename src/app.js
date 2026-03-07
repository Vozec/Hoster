const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const Route = require('./models/Route');
const Config = require('./models/Config');

const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/apiRoutes');
const { router: dynamicRouter, refreshDynamicRoutes } = require('./routes/dynamic');
const { authenticateToken } = require('./middlewares/auth');
const apiKeyAuth = require('./middlewares/apiKeyAuth');
const { logRouteAccess } = require('./middlewares/logger');
const evaluatePhp = require('./utils/phpEvaluator');
const { normalizePath } = require('./utils/pathUtils');

dotenv.config();
const app = express();

const rateLimitStore = new Map();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const socketService = require('./services/socketService');
const io = socketService.init(server);

const ADMIN_PATH = (process.env.ADMIN_PATH || '/manager').endsWith('/')
  ? process.env.ADMIN_PATH || '/manager'
  : (process.env.ADMIN_PATH || '/manager') + '/';
const API_PATH = process.env.API_PATH || '/api';

function normalizeDynamicPath(p) {
  return normalizePath(p.split('?')[0]);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

app.use(API_PATH, indexRoutes);
app.use(`${API_PATH}/admin`, authenticateToken, adminRoutes);
app.use(`${API_PATH}/v1`, apiRoutes);

app.use(ADMIN_PATH, express.static(path.join(__dirname, '../admin-frontend/build')));
app.use(ADMIN_PATH.slice(0, -1), express.static(path.join(__dirname, '../admin-frontend/build')));

app.use(async (req, res, next) => {
  try {
    const requestPath = req.originalUrl;

    if (requestPath.startsWith(API_PATH)) return next();

    if (requestPath.startsWith(ADMIN_PATH) || requestPath === ADMIN_PATH.slice(0, -1)) {
      const indexPath = path.join(__dirname, '../admin-frontend/build', 'index.html');
      if (requestPath === ADMIN_PATH || requestPath === ADMIN_PATH.slice(0, -1)) {
        return res.redirect(`${ADMIN_PATH}#/login`);
      }
      return res.sendFile(indexPath);
    }

    const basePath = normalizeDynamicPath(requestPath);

    const route = await Route.findOne({ path: basePath });
    const targetRoute = route || (await Route.findOne({ path: '/' }));

    if (!targetRoute) {
      return res.status(404).send('Route not found');
    }

    if (targetRoute.corsConfig && targetRoute.corsConfig.enabled) {
      res.header('Access-Control-Allow-Origin', targetRoute.corsConfig.allowOrigin || '*');
      res.header('Access-Control-Allow-Headers', targetRoute.corsConfig.allowHeaders || '*');
      res.header(
        'Access-Control-Allow-Methods',
        targetRoute.corsConfig.allowMethods || 'GET,POST,OPTIONS,DELETE,PUT'
      );
    } else {
      let globalCors;
      try {
        const corsConfig = await Config.findOne({ key: 'cors' });
        globalCors = corsConfig ? corsConfig.value : null;
      } catch {
        globalCors = null;
      }
      res.header(
        'Access-Control-Allow-Origin',
        (globalCors && globalCors.allowOrigin) || process.env.CORS_ALLOW_ORIGIN || '*'
      );
      res.header(
        'Access-Control-Allow-Headers',
        (globalCors && globalCors.allowHeaders) || process.env.CORS_ALLOW_HEADERS || '*'
      );
      res.header(
        'Access-Control-Allow-Methods',
        (globalCors && globalCors.allowMethods) ||
          process.env.CORS_ALLOW_METHODS ||
          'GET,POST,OPTIONS,DELETE,PUT'
      );
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (targetRoute.rateLimit?.enabled) {
      const rlKey = `${targetRoute._id}:${req.ip}`;
      const now = Date.now();
      const window = targetRoute.rateLimit.windowMs || 60000;
      const max = targetRoute.rateLimit.maxRequests || 60;
      const entry = rateLimitStore.get(rlKey);
      if (!entry || entry.resetAt < now) {
        rateLimitStore.set(rlKey, { count: 1, resetAt: now + window });
      } else {
        entry.count++;
        if (entry.count > max) {
          res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
          return res.status(429).json({ message: 'Too Many Requests' });
        }
      }
    }

    if (targetRoute.customHeaders && targetRoute.customHeaders.length > 0) {
      for (const h of targetRoute.customHeaders) {
        if (h.key) res.setHeader(h.key, h.value || '');
      }
    } else {
      try {
        const headersConfig = await Config.findOne({ key: 'customHeaders' });
        if (headersConfig && Array.isArray(headersConfig.value)) {
          for (const h of headersConfig.value) {
            if (h.key) res.setHeader(h.key, h.value || '');
          }
        }
      } catch {}
    }

    logRouteAccess(req, res, () => {});

    if (targetRoute.contentType && targetRoute.contentType.toLowerCase().includes('php')) {
      try {
        return await evaluatePhp(targetRoute.content, req, res);
      } catch (phpError) {
        console.error('Erreur PHP:', phpError);
        if (!res.headersSent) {
          return res.status(500).send(`<pre>PHP Evaluation Error: ${phpError.message}</pre>`);
        }
        return;
      }
    }

    res.type(targetRoute.contentType || 'text/plain');

    if (targetRoute.contentDisposition) {
      res.setHeader('Content-Disposition', targetRoute.contentDisposition);
    }

    if (targetRoute.contentEncoding === 'base64' || targetRoute.contentEncoding === 'file') {
      return res.end(Buffer.from(targetRoute.content, 'base64'));
    } else if (targetRoute.contentEncoding === 'hex') {
      return res.end(Buffer.from(targetRoute.content, 'hex'));
    }

    return res.end(targetRoute.content);
  } catch (error) {
    console.error('Error processing route:', error);
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).send('Something broke!');
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('Connected to MongoDB');

    const existingRoot = await Route.findOne({ path: '/' });
    if (!existingRoot) {
      await Route.create({
        path: '/',
        name: 'root',
        contentType: 'text/plain',
        contentEncoding: 'text',
        content: 'It Works',
        category: 'classic',
      });
      console.log('Created default root route /');
    }
    refreshDynamicRoutes(app);
    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

module.exports = app;
