const API_URL = '/api';

async function request(method, path, body) {
  const token = sessionStorage.getItem('angler_token');
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
    sessionStorage.removeItem('angler_token');
    window.location.reload();
    throw new Error('Sessão expirada.');
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  sendCode: (data) => request('POST', '/auth/send-code', data),
  verifyCode: (email, code) => request('POST', '/auth/verify-code', { email, code }),
  verify: () => request('GET', '/auth/verify'),

  // Data
  getData: (section) => request('GET', `/data/${section}`),
  saveData: (section, data) => request('PUT', `/data/${section}`, { data }),
  deleteData: (section) => request('DELETE', `/data/${section}`),

  // IA
  getIAConfig: () => request('GET', '/ia/config'),
  saveIAConfig: (apiKey, model) => request('PUT', '/ia/config', { apiKey, model }),
  chat: (messages, model) => request('POST', '/ia/chat', { messages, model }),
  getHistory: () => request('GET', '/ia/history'),
  clearHistory: () => request('DELETE', '/ia/history'),
  getModels: () => request('GET', '/ia/models'),
};
