import api, { setToken, clearToken } from './api';

const authService = {

  /* POST /api/auth/login */
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    return data.user;
  },

  /* POST /api/auth/logout */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearToken();
    }
  },

  /* GET /api/auth/me — validates stored token, returns user */
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  /* PUT /api/auth/password */
  updatePassword: async (current_password, password, password_confirmation) => {
    const { data } = await api.put('/auth/password', {
      current_password,
      password,
      password_confirmation,
    });
    return data;
  },

};

export default authService;
