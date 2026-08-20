import api from './api';

const projectService = {

  /* GET /api/projects */
  getAll: async () => {
    const { data } = await api.get('/projects');
    return data.data;
  },

  /* GET /api/projects/:id */
  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data.data;
  },

  /* POST /api/projects */
  create: async (payload) => {
    const { data } = await api.post('/projects', toSnake(payload));
    return data.data;
  },

  /* PUT /api/projects/:id */
  update: async (id, payload) => {
    const { data } = await api.put(`/projects/${id}`, toSnake(payload));
    return data.data;
  },

  /* DELETE /api/projects/:id */
  delete: async (id) => {
    await api.delete(`/projects/${id}`);
  },

  /* PUT /api/projects/:id/completion */
  updateCompletion: async (id, completion) => {
    await api.put(`/projects/${id}/completion`, { completion });
  },

  // ── Milestones ──────────────────────────────────────────────
  addMilestone: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/milestones`, {
      name: data.name, due_date: data.dueDate,
    });
    return res.data.data;
  },

  updateMilestone: async (projectId, milestoneId, data) => {
    await api.put(`/projects/${projectId}/milestones/${milestoneId}`, {
      name: data.name, due_date: data.dueDate,
      status: data.status, completed_date: data.completedDate,
    });
  },

  deleteMilestone: async (projectId, milestoneId) => {
    await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  },

  toggleCycleTarget: async (projectId, milestoneId) => {
    const res = await api.put(`/projects/${projectId}/milestones/${milestoneId}/toggle-cycle`);
    return res.data.cycleTargeted;
  },

  // ── Payments ────────────────────────────────────────────────
  addPayment: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/payments`, {
      amount: data.amount, type: data.type,
      date: data.date, status: data.status, notes: data.notes,
    });
    return res.data.data;
  },

  updatePayment: async (projectId, paymentId, data) => {
    await api.put(`/projects/${projectId}/payments/${paymentId}`, {
      amount: data.amount, type: data.type,
      date: data.date, status: data.status, notes: data.notes,
    });
  },

  deletePayment: async (projectId, paymentId) => {
    await api.delete(`/projects/${projectId}/payments/${paymentId}`);
  },

  // ── Blockers ─────────────────────────────────────────────────
  addBlocker: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/blockers`, {
      type: data.type, description: data.description,
    });
    return res.data.data;
  },

  resolveBlocker: async (projectId, blockerId) => {
    await api.put(`/projects/${projectId}/blockers/${blockerId}/resolve`);
  },

  deleteBlocker: async (projectId, blockerId) => {
    await api.delete(`/projects/${projectId}/blockers/${blockerId}`);
  },

  // ── Achievements ─────────────────────────────────────────────
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
  return {
    name:              p.name,
    client_id:         p.clientId,
    bd_owner_id:       p.bdOwner,
    pm_owner_id:       p.pmOwner,
    category:          p.category,
    status:            p.status,
    completion:        p.completion,
    start_date:        p.startDate,
    end_date:          p.endDate,
    budget:            p.budget,
    description:       p.description,
    client_commitment: p.clientCommitment,
    color:             p.color,
    milestones:        p.milestones,
    payments:          p.payments,
  };
}

export default projectService;
