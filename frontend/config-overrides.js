module.exports = function override(config, env) {
  if (env === 'production') {
    config.optimization.minimize = false;    
    config.optimization.minimizer = [];
  }
  
  return config;
};
