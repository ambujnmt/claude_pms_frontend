import api, { setToken, clearToken } from './api';

const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    return data.user;
  },
  logout: async () => {
    try { await api.post('/auth/logout'); } finally { clearToken(); }
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
  },
  updatePassword: async (current_password, password, password_confirmation) => {
    const { data } = await api.put('/auth/password', { current_password, password, password_confirmation });
    return data;
  },
};

export default authService;
