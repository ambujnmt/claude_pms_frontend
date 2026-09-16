import api from './api';

const hostingService = {

  getAll: async () => {
    const { data } = await api.get('/hosting');
    return data.data;
  },

  create: async (payload) => {
    const { data } = await api.post('/hosting', toSnake(payload));
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/hosting/${id}`, toSnake(payload));
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/hosting/${id}`);
  },
};

function toSnake(h) {
  return {
    client_id:      h.clientId ? parseInt(h.clientId) : null,
    client_name:    h.clientName,
    domain:         h.domain,
    plan:           h.plan,
    renewal_date:   h.renewalDate,
    annual_amount:  parseFloat(h.annualAmount) || 0,
    status:         h.status,
    server:         h.server,
    addons:         h.addons || [],
    contact_email:  h.contactEmail,
  };
}

export default hostingService;
