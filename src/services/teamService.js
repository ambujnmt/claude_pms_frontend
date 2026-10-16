import api from './api';

const teamService = {
  /* Members the logged-in manager may assign as project resources (their own team; admins: everyone assignable) */
  myTeam: async () => {
    const { data } = await api.get('/my-team');
    return data.data;
  },
  /* [{id, managerId}] - admins only */
  structure: async () => {
    const { data } = await api.get('/team-structure');
    return data.data;
  },
  setManager: async (userId, managerId) => {
    const { data } = await api.put(`/users/${userId}/manager`, { manager_id: managerId ? parseInt(managerId) : null });
    return data.data;
  },
};

export default teamService;
