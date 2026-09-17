import api from './api';

const clientService = {

  /* GET /api/clients */
  getAll: async () => {
    const { data } = await api.get('/clients');
    return data.data;
  },

  /* GET /api/clients/:id */
  getById: async (id) => {
    const { data } = await api.get(`/clients/${id}`);
    return data.data;
  },

  /* POST /api/clients */
  create: async (payload) => {
    const { data } = await api.post('/clients', toSnake(payload));
    return data.data;
  },

  /* PUT /api/clients/:id */
  update: async (id, payload) => {
    const { data } = await api.put(`/clients/${id}`, toSnake(payload));
    return data.data;
  },

  /* DELETE /api/clients/:id */
  delete: async (id) => {
    await api.delete(`/clients/${id}`);
  },

};

/* camelCase → snake_case for Laravel */
function toSnake(c) {
  return {
    name:           c.name,
    contact_person: c.contactPerson || null,
    email:          c.email         || null,
    phone:          c.phone         || null,
    city:           c.city          || null,
    industry:       c.industry      || null,
    status:         c.status        || 'active',
    notes:          c.notes         || null,
  };
}

export default clientService;
