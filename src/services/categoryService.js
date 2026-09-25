import api from './api';

const categoryService = {

  getAll: async () => {
    const { data } = await api.get('/categories');
    return data.data;
  },

  create: async (payload) => {
    const { data } = await api.post('/categories', toSnake(payload));
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/categories/${id}`, toSnake(payload));
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/categories/${id}`);
  },
};

function toSnake(c) {
  return {
    name:      c.name,
    color:     c.color,
    icon:      c.icon || null,
    is_active: c.isActive ?? true,
  };
}

export default categoryService;
