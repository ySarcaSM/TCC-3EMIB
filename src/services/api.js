const API_URL = '/api';

async function request(method, path, body) {
  const token = localStorage.getItem('angler_token');
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const resp = await fetch(`${API_URL}${path}`, opts);

  if (resp.status === 401) {
    localStorage.removeItem('angler_token');
    window.location.reload();
    throw new Error('Sessão expirada.');
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data;
}

export const api = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  register: (username, password) => request('POST', '/auth/register', { username, password }),
  verify: () => request('GET', '/auth/verify'),
  getData: (section) => request('GET', `/data/${section}`),
  saveData: (section, data) => request('PUT', `/data/${section}`, { data }),
  deleteData: (section) => request('DELETE', `/data/${section}`),
  getIAConfig: () => request('GET', '/ia/config'),
  saveIAConfig: (apiKey, model) => request('PUT', '/ia/config', { apiKey, model }),
  chat: (messages, model) => request('POST', '/ia/chat', { messages, model }),
  getHistory: () => request('GET', '/ia/history'),
  clearHistory: () => request('DELETE', '/ia/history'),
  getModels: () => request('GET', '/ia/models'),
};