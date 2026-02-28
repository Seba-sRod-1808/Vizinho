const API = process.env.REACT_APP_BACKEND_URL;

class ApiClient {
  constructor() {
    this.baseUrl = API;
  }

  getToken() {
    return localStorage.getItem('vizinho_token');
  }

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('vizinho_token');
      localStorage.removeItem('vizinho_user');
      window.location.href = '/login';
      throw new Error('No autenticado');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error del servidor' }));
      throw new Error(err.detail || 'Error del servidor');
    }
    return res.json();
  }

  get(path) { return this.request(path); }
  post(path, data) { return this.request(path, { method: 'POST', body: JSON.stringify(data) }); }
  put(path, data) { return this.request(path, { method: 'PUT', body: JSON.stringify(data) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }
}

const api = new ApiClient();
export default api;
