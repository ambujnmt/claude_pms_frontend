import api from './api';

const serviceTypeService = {
  getAll: async () => {
    const { data } = await api.get('/service-types');
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/service-types', payload);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/service-types/${id}`, payload);
    return data.data;
  },
  delete: async (id) => {
    await api.delete(`/service-types/${id}`);
  },
};

export default serviceTypeService;
