const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is missing',
    });
  }

  const allowedApiKeys = process.env.API_KEY
    ? process.env.API_KEY.split(',').map((key) => key.trim())
    : [];

  if (!allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  next();
};

module.exports = apiKeyAuth;
