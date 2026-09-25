import api from './api';

const projectService = {

  getAll: async () => {
    const { data } = await api.get('/projects');
    return data.data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data.data;
  },

  create: async (payload) => {
    const { data } = await api.post('/projects', toSnake(payload));
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/projects/${id}`, toSnake(payload));
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/projects/${id}`);
  },

  updateCompletion: async (id, completion) => {
    await api.put(`/projects/${id}/completion`, { completion });
  },

  addMilestone: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/milestones`, {
      name: data.name, due_date: data.dueDate || null,
    });
    return res.data.data;
  },

  updateMilestone: async (projectId, milestoneId, data) => {
    await api.put(`/projects/${projectId}/milestones/${milestoneId}`, {
      name:            data.name,
      due_date:        data.dueDate        || null,
      status:          data.status         || 'upcoming',
      completed_date:  data.completedDate  || null,
    });
  },

  deleteMilestone: async (projectId, milestoneId) => {
    await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  },

  toggleCycleTarget: async (projectId, milestoneId) => {
    const res = await api.put(`/projects/${projectId}/milestones/${milestoneId}/toggle-cycle`);
    return res.data.cycleTargeted;
  },

  addPayment: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/payments`, {
      amount: parseFloat(data.amount),
      type:   data.type,
      date:   data.date   || null,
      status: data.status || 'upcoming',
      notes:  data.notes  || null,
    });
    return res.data.data;
  },

  updatePayment: async (projectId, paymentId, data) => {
    await api.put(`/projects/${projectId}/payments/${paymentId}`, {
      amount: parseFloat(data.amount),
      type:   data.type,
      date:   data.date   || null,
      status: data.status,
      notes:  data.notes  || null,
    });
  },

  deletePayment: async (projectId, paymentId) => {
    await api.delete(`/projects/${projectId}/payments/${paymentId}`);
  },

  addBlocker: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/blockers`, {
      type:        data.type,
      description: data.description,
    });
    return res.data.data;
  },

  resolveBlocker: async (projectId, blockerId) => {
    await api.put(`/projects/${projectId}/blockers/${blockerId}/resolve`);
  },

  deleteBlocker: async (projectId, blockerId) => {
    await api.delete(`/projects/${projectId}/blockers/${blockerId}`);
  },

  addAchievement: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/achievements`, {
      description: data.description,
    });
    return res.data.data;
  },

  deleteAchievement: async (projectId, achievementId) => {
    await api.delete(`/projects/${projectId}/achievements/${achievementId}`);
  },
};

/* camelCase → snake_case for project payload */
function toSnake(p) {
  const out = {};
  if (p.name              !== undefined) out.name              = p.name;
  if (p.clientId          !== undefined) out.client_id         = p.clientId ? parseInt(p.clientId) : null;
  if (p.bdOwner           !== undefined) out.bd_owner_id       = p.bdOwner  ? parseInt(p.bdOwner)  : null;
  if (p.pmOwner           !== undefined) out.pm_owner_id       = p.pmOwner  ? parseInt(p.pmOwner)  : null;
  if (p.category          !== undefined) out.category          = p.category;
  if (p.status             !== undefined) out.status            = p.status;
  if (p.completion        !== undefined) out.completion        = p.completion;
  if (p.startDate         !== undefined) out.start_date        = p.startDate   || null;
  if (p.endDate           !== undefined) out.end_date          = p.endDate     || null;
  if (p.budget            !== undefined) out.budget            = parseFloat(p.budget) || 0;
  if (p.description       !== undefined) out.description       = p.description       || null;
  if (p.clientCommitment  !== undefined) out.client_commitment = p.clientCommitment  || null;
  if (p.color             !== undefined) out.color             = p.color;
  if (p.milestones        !== undefined) out.milestones        = p.milestones;
  if (p.payments          !== undefined) out.payments          = p.payments;
  // Multi-select bench resources — array of user ids
  if (p.resources         !== undefined) out.resources         = (p.resources || []).map(id => parseInt(id));
  return out;
}

export default projectService;
