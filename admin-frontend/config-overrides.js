module.exports = function override(config, env) {
  // Désactiver la minification
  if (env === 'production') {
    config.optimization.minimize = false;
    
    // Désactiver les plugins de minification
    config.optimization.minimizer = [];
  }
  
  return config;
};
