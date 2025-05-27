/**
 * Middleware to authenticate API requests using API key
 */

const apiKeyAuth = (req, res, next) => {
  // Get API key from request headers
  const apiKey = req.headers['x-api-key'];
  
  // Check if API key is provided
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API key is missing' 
    });
  }
  
  // Check if API key is valid
  const allowedApiKeys = process.env.API_KEY
    ? process.env.API_KEY.split(',').map(key => key.trim())
    : [];

  if (!allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid API key' 
    });
  }
  
  // If API key is valid, proceed to the next middleware or route handler
  next();
};

module.exports = apiKeyAuth;
