import api from './api';
import { normalizeWebsite } from '../utils/clientValidation';

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
    alternate_email: c.alternateEmail || null,
    website:        normalizeWebsite(c.website) || null,
    phone:          c.phone         || null,
    alternate_phone: c.alternatePhone || null,
    city:           c.city          || null,
    address:        c.address       || null,
    industry:       c.industry      || null,
    status:         c.status        || 'active',
    notes:          c.notes         || null,
  };
}

/* Laravel 422 {errors:{email:[..],phone:[..]}} -> { email:'..', phone:'..', api:'..' } for inline field errors */
export function mapClientErrors(err) {
  const raw = err?.response?.data?.errors;
  if (!raw) return { api: err?.response?.status === 403 ? 'You do not have permission to do this.' : (err?.response?.data?.message || 'Could not save the client. Please check your internet connection and try again.') };
  const keys = { email:'email', alternate_email:'alternateEmail', phone:'phone', alternate_phone:'alternatePhone', name:'name', website:'website',
                 contact_person:'contactPerson', city:'city', address:'address', industry:'industry', status:'status', notes:'notes' };
  const out = {};
  const other = [];
  Object.entries(raw).forEach(([k, v]) => {
    const msg = [].concat(v)[0];
    if (keys[k]) out[keys[k]] = msg; else other.push(msg);
  });
  if (other.length) out.api = other.join(' ');
  return out;
}

export default clientService;
