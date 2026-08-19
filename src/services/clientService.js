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
    const { data } = await api.post('/clients', toSnakeCase(payload));
    return data.data;
  },

  /* PUT /api/clients/:id */
  update: async (id, payload) => {
    const { data } = await api.put(`/clients/${id}`, toSnakeCase(payload));
    return data.data;
  },

  /* DELETE /api/clients/:id */
  delete: async (id) => {
    await api.delete(`/clients/${id}`);
  },

};

/* Convert React camelCase keys → Laravel snake_case */
function toSnakeCase(obj) {
  return {
    name:           obj.name,
    contact_person: obj.contactPerson,
    email:          obj.email,
    phone:          obj.phone,
    city:           obj.city,
    industry:       obj.industry,
    status:         obj.status,
    since:          obj.since,
    notes:          obj.notes,
  };
}

export default clientService;
