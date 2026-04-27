import axios from 'axios';

export function createHosterClient({ baseUrl, apiKey, apiPath = '/api' }) {
  if (!baseUrl) throw new Error('HOSTER_URL is required');
  if (!apiKey) throw new Error('HOSTER_API_KEY is required');

  const root = `${baseUrl.replace(/\/+$/, '')}${apiPath}`;

  const http = axios.create({
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    timeout: 20000,
    validateStatus: () => true,
  });

  async function call(method, url, { params, data } = {}) {
    const res = await http.request({ method, url, params, data });
    if (res.status >= 400) {
      const msg = res.data?.message || res.statusText || 'Request failed';
      const err = new Error(`Hoster ${method} ${url} → ${res.status}: ${msg}`);
      err.status = res.status;
      err.body = res.data;
      throw err;
    }
    return res.data;
  }

  const v1 = (p) => `${root}/v1${p}`;
  const admin = (p) => `${root}/admin${p}`;

  return {
    // Routes (v1, accessible via API key)
    listRoutes: (params) => call('GET', v1('/routes'), { params }),
    getRoute: (id) => call('GET', v1(`/routes/${encodeURIComponent(id)}`)),
    createRoute: (data) => call('POST', v1('/routes'), { data }),
    updateRoute: (id, data) => call('PUT', v1(`/routes/${encodeURIComponent(id)}`), { data }),
    deleteRoute: (id) => call('DELETE', v1(`/routes/${encodeURIComponent(id)}`)),
    deleteRoutes: (ids) => call('POST', v1('/routes/delete-multiple'), { data: { ids } }),
    getRouteLogs: (id) => call('GET', v1(`/routes/${encodeURIComponent(id)}/logs`)),
    getStats: () => call('GET', v1('/stats')),
    getLogs: (params) => call('GET', v1('/logs'), { params }),

    // Admin (now also accepts API key thanks to adminAuth middleware)
    cloneRoute: (id, targetPath) =>
      call('POST', admin(`/routes/${encodeURIComponent(id)}/clone`), {
        data: targetPath ? { targetPath } : {},
      }),
    exportRoutes: (password) =>
      call('GET', admin('/routes/export'), { params: password ? { password } : undefined }),
    importRoutes: (payload) => call('POST', admin('/routes/import'), { data: payload }),
    getCorsConfig: () => call('GET', admin('/cors-config')),
    updateCorsConfig: (data) => call('PUT', admin('/cors-config'), { data }),
    getCustomHeadersConfig: () => call('GET', admin('/custom-headers-config')),
    updateCustomHeadersConfig: (data) => call('PUT', admin('/custom-headers-config'), { data }),
  };
}
