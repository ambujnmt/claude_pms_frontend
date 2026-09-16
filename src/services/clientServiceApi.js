import api from './api';

const clientServiceApi = {

  getAll: async (clientId = null) => {
    const url = clientId ? `/client-services?client_id=${clientId}` : '/client-services';
    const { data } = await api.get(url);
    return data.data;
  },

  create: async (payload) => {
    const { data } = await api.post('/client-services', toSnake(payload));
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/client-services/${id}`, toSnake(payload));
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/client-services/${id}`);
  },
};

function toSnake(cs) {
  return {
    client_id:       cs.clientId ? parseInt(cs.clientId) : undefined,
    service_type_id: cs.serviceId ? parseInt(cs.serviceId) : null,
    name:            cs.name,
    contract_type:   cs.contractType,
    monthly_amount:  parseFloat(cs.monthlyAmount) || 0,
    billing_cycle:   cs.billingCycle,
    status:          cs.status,
    start_date:      cs.startDate,
    renewal_date:    cs.renewalDate,
    notes:           cs.notes,
  };
}

export default clientServiceApi;
