import api from './api';

/* Portal settings: billing cycle (read: managers, write: super admin only) */
const settingsService = {
  getBillingCycle: async () => {
    const { data } = await api.get('/settings/billing-cycle');
    return data.data || null;                     // { start:'YYYY-MM-DD', end:'YYYY-MM-DD' } | null
  },
  saveBillingCycle: async ({ start, end }) => {
    const { data } = await api.put('/settings/billing-cycle', { start, end });
    return data.data;
  },
};

export const settingsError = (err, fallback = 'Could not save. Please try again.') => {
  const e = err?.response?.data?.errors;
  if (e) return Object.values(e).flat().join(' ');
  if (err?.response?.status === 403) return err.response.data?.message || 'Only the Super Admin can change this setting.';
  return err?.response?.data?.message || fallback;
};

export default settingsService;
