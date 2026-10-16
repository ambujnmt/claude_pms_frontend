import api from './api';

const ticketService = {
  /* GET /api/tickets  (managers: all, everyone else: raised by / assigned to me) */
  getAll: async (params = {}) => {
    const { data } = await api.get('/tickets', { params });
    return data.data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/tickets/${id}`);
    return data.data;
  },

  /* POST /api/tickets - any signed-in user */
  create: async (t) => {
    const { data } = await api.post('/tickets', {
      title:       t.title,
      description: t.description,
      category:    t.category || 'Other',
      priority:    t.priority || 'medium',
      project_id:  t.projectId ? parseInt(t.projectId) : null,
    });
    return data.data;
  },

  /* PUT /api/tickets/:id - managers: status / priority / assignee / resolution; raiser: edit while open, re-open */
  update: async (id, t) => {
    const out = {};
    if (t.title           !== undefined) out.title           = t.title;
    if (t.description     !== undefined) out.description     = t.description;
    if (t.category        !== undefined) out.category        = t.category;
    if (t.priority        !== undefined) out.priority        = t.priority;
    if (t.status          !== undefined) out.status          = t.status;
    if (t.assignedTo      !== undefined) out.assigned_to     = t.assignedTo ? parseInt(t.assignedTo) : null;
    if (t.resolutionNote  !== undefined) out.resolution_note = t.resolutionNote || null;
    const { data } = await api.put(`/tickets/${id}`, out);
    return data.data;
  },

  comment: async (id, body) => {
    const { data } = await api.post(`/tickets/${id}/comments`, { body });
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/tickets/${id}`);
  },
};

export const TICKET_CATEGORIES = ['Bug / Issue', 'Access / Login', 'Project Help', 'Hardware', 'Software / Tools', 'Payment / Invoice', 'Other'];
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const TICKET_STATUSES   = ['open', 'in_progress', 'resolved', 'closed'];

export default ticketService;
