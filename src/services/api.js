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

  // ✅ FIX: NÃO recarrega a página em endpoints de auth (login, cadastro, etc)
  // Só recarrega quando a sessão expira em endpoints autenticados
  if (resp.status === 401) {
    const isAuthEndpoint = path.startsWith('/auth/login') ||
                           path.startsWith('/auth/send-code') ||
                           path.startsWith('/auth/verify-code') ||
                           path.startsWith('/auth/forgot-password') ||
                           path.startsWith('/auth/reset-password') ||
                           path.startsWith('/auth/forgot-username');

    if (!isAuthEndpoint) {
      // Sessão expirou em endpoint autenticado — recarrega
      sessionStorage.removeItem('angler_token');
      window.location.reload();
    }

    // Sempre lança o erro para o chamador tratar
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || 'Usuário ou senha incorretos.');
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data;
}

export const api = {
  // Auth — Login
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  verify: () => request('GET', '/auth/verify'),

  // Auth — Cadastro
  sendCode: (data) => request('POST', '/auth/send-code', data),
  verifyCode: (email, code) => request('POST', '/auth/verify-code', { email, code }),

  // Auth — Esqueceu senha
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
  resetPassword: (email, code, newPassword) => request('POST', '/auth/reset-password', { email, code, newPassword }),

  // Auth — Esqueceu usuário
  forgotUsername: (email) => request('POST', '/auth/forgot-username', { email }),

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
