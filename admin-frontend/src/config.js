import axios from 'axios';

// Configuration basée sur les variables d'environnement
const config = {
  // S'assurer que le chemin d'administration se termine toujours par un slash
  adminPath: (process.env.REACT_APP_ADMIN_PATH || '/manager/').endsWith('/') ? (process.env.REACT_APP_ADMIN_PATH || '/manager/') : (process.env.REACT_APP_ADMIN_PATH || '/manager/') + '/',
  apiPath: process.env.REACT_APP_API_PATH || '/api',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  
  // Chemins complets
  get adminRoutes() {
    return {
      login: '/login',
      home: '/',
      routes: '/routes',
      newRoute: '/routes/new',
      editRoute: (id) => `/routes/${id}/edit`,
      routeDetails: (id) => `/routes/${id}`,
    };
  },
  
  get apiRoutes() {
    return {
      // Routes d'authentification (dans le router index)
      login: `${this.apiUrl}${this.apiPath}/auth/login`,
      verify: `${this.apiUrl}${this.apiPath}/auth/verify`,
      config: `${this.apiUrl}${this.apiPath}/config`,
      
      // Routes admin (dans le router admin, protégées par authenticateToken)
      routes: `${this.apiUrl}${this.apiPath}/admin/routes`,
      route: (id) => `${this.apiUrl}${this.apiPath}/admin/routes/${id}`,
      routeLogs: (id) => `${this.apiUrl}${this.apiPath}/admin/routes/${id}/logs`,
      deleteMultiple: `${this.apiUrl}${this.apiPath}/admin/routes/delete-multiple`,
      stats: `${this.apiUrl}${this.apiPath}/admin/stats`,
    };
  }
};

export default config; 