const AccessLog = require('../models/AccessLog');
const Route = require('../models/Route');
const socketService = require('../services/socketService');

// Function to format the raw request in HTTP format
const formatRawRequest = (req) => {
  const { method, originalUrl, httpVersion = '1.1', headers, query, body } = req;
  
  // Request line
  let rawRequest = `${method} ${originalUrl} HTTP/${httpVersion}\n`;
  
  // Headers
  Object.entries(headers).forEach(([key, value]) => {
    rawRequest += `${key}: ${value}\n`;
  });
  
  // Empty line separating headers from body
  rawRequest += '\n';
  
  // Request body for non-GET methods
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
    // Get the corresponding route
    const path = req.originalUrl;
    const route = await Route.findOne({ path });
    
    if (route) {
      // Format the raw request
      const rawRequest = formatRawRequest(req);
      
      // Create an access log
      const log = new AccessLog({
        routeId: route._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        headers: req.headers,
        rawRequest
      });
      
      // Enregistrer de manière asynchrone et émettre un événement Socket.IO
      log.save()
        .then(savedLog => {
          // Émettre un événement Socket.IO avec le log sauvegardé
          socketService.emitRouteLog(route._id.toString(), savedLog);
        })
        .catch(err => console.error('Erreur lors de l\'enregistrement du log:', err));
    }
  
    
    next();
  } catch (error) {
    console.error('Erreur dans le middleware de logging:', error);
    next();
  }
};

module.exports = {
  logRouteAccess
};
