import api from './api';

const domainService = {
  getAll: async () => {
    const { data } = await api.get('/domains');
    return data.data;
  },
  create: async (d) => {
    const { data } = await api.post('/domains', toSnake(d));
    return data.data;
  },
  update: async (id, d) => {
    const { data } = await api.put(`/domains/${id}`, toSnake(d));
    return data.data;
  },
  delete: async (id) => {
    await api.delete(`/domains/${id}`);
  },
};

function toSnake(d) {
  return {
    domain:         d.domain,
    client_id:      d.clientId ? parseInt(d.clientId) : null,
    registrar:      d.registrar     || null,
    dns_provider:   d.dnsProvider   || null,
    registered_on:  d.registeredOn  || null,
    expires_on:     d.expiresOn,
    auto_renew:     !!d.autoRenew,
    nameservers:    d.nameservers   || null,
    renewal_amount: parseFloat(d.renewalAmount) || 0,
    currency_id:    d.currencyId ? parseInt(d.currencyId) : null,
    status:         d.status || 'active',
    notes:          d.notes || null,
  };
}

export default domainService;
