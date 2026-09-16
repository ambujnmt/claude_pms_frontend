import api from './api';

const currencyService = {

  getAll: async () => {
    const { data } = await api.get('/currencies');
    return { list: data.data, default: data.default };
  },

  create: async (payload) => {
    const { data } = await api.post('/currencies', toSnake(payload));
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/currencies/${id}`, toSnake(payload));
    return data.data;
  },

  delete: async (id) => {
    await api.delete(`/currencies/${id}`);
  },

  setDefault: async (id) => {
    const { data } = await api.put(`/currencies/${id}/set-default`);
    return data.data;
  },
};

function toSnake(c) {
  return {
    name:                c.name,
    code:                c.code,
    symbol:              c.symbol,
    symbol_position:     c.symbolPosition,
    decimal_places:      c.decimalPlaces,
    thousands_separator: c.thousandsSeparator,
    decimal_separator:   c.decimalSeparator,
    use_lakh_system:     c.useLakhSystem,
    is_active:           c.isActive,
  };
}

export default currencyService;
