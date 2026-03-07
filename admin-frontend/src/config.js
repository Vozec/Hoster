import axios from 'axios';

const config = {
  adminPath: (process.env.REACT_APP_ADMIN_PATH || '/manager/').endsWith('/')
    ? process.env.REACT_APP_ADMIN_PATH || '/manager/'
    : (process.env.REACT_APP_ADMIN_PATH || '/manager/') + '/',
  apiPath: process.env.REACT_APP_API_PATH || '/api',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',

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
      login: `${this.apiUrl}${this.apiPath}/auth/login`,
      verify: `${this.apiUrl}${this.apiPath}/auth/verify`,
      config: `${this.apiUrl}${this.apiPath}/config`,

      routes: `${this.apiUrl}${this.apiPath}/admin/routes`,
      route: (id) => `${this.apiUrl}${this.apiPath}/admin/routes/${id}`,
      routeLogs: (id) => `${this.apiUrl}${this.apiPath}/admin/routes/${id}/logs`,
      cloneRoute: (id) => `${this.apiUrl}${this.apiPath}/admin/routes/${id}/clone`,
      deleteMultiple: `${this.apiUrl}${this.apiPath}/admin/routes/delete-multiple`,
      stats: `${this.apiUrl}${this.apiPath}/admin/stats`,
      exportRoutes: `${this.apiUrl}${this.apiPath}/admin/routes/export`,
      importRoutes: `${this.apiUrl}${this.apiPath}/admin/routes/import`,
      corsConfig: `${this.apiUrl}${this.apiPath}/admin/cors-config`,
      customHeadersConfig: `${this.apiUrl}${this.apiPath}/admin/custom-headers-config`,
    };
  },
};

export default config;
