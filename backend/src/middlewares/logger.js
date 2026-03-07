const AccessLog = require('../models/AccessLog');
const Route = require('../models/Route');
const socketService = require('../services/socketService');

const formatRawRequest = (req) => {
  const { method, originalUrl, httpVersion = '1.1', headers, query, body } = req;

  let rawRequest = `${method} ${originalUrl} HTTP/${httpVersion}\n`;

  Object.entries(headers).forEach(([key, value]) => {
    rawRequest += `${key}: ${value}\n`;
  });

  rawRequest += '\n';

  if (method !== 'GET' && body) {
    try {
      rawRequest += typeof body === 'object' ? JSON.stringify(body, null, 2) : body;
    } catch (e) {
      rawRequest += '[Request body not displayable]';
    }
  }

  return rawRequest;
};

const logRouteAccess = async (req, res, next) => {
  try {
    const path = req.originalUrl.split('?')[0];
    const route = await Route.findOne({ path });

    if (route) {
      const rawRequest = formatRawRequest(req);

      const log = new AccessLog({
        routeId: route._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        headers: req.headers,
        rawRequest,
      });

      log
        .save()
        .then((savedLog) => {
          socketService.emitRouteLog(route._id.toString(), savedLog);
        })
        .catch((err) => console.error("Erreur lors de l'enregistrement du log:", err));
    }

    next();
  } catch (error) {
    console.error('Erreur dans le middleware de logging:', error);
    next();
  }
};

module.exports = {
  logRouteAccess,
};
