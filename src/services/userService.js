import api from './api';

const userService = {

  getAll: async () => {
    const { data } = await api.get('/users');
    return data.data;
  },

  create: async (payload) => {
    const { data } = await api.post('/users', toSnake(payload));
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/users/${id}`, toSnake(payload));
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/users/${id}`);
  },
};

function toSnake(u) {
  const out = {
    name:      u.name,
    email:     u.email,
    role:      u.role,
    avatar:    u.avatar || null,
    is_active: u.isActive ?? true,
  };
  // Only send password if the caller actually provided one
  // (create requires it; edit leaves it out to keep the current one)
  if (u.password) out.password = u.password;
  return out;
}

export default userService;
