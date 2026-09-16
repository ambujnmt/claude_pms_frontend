import axios from 'axios';

const BASE_URL = 'https://site2demo.in/nexus-api-auth/public/api';
const TOKEN_KEY = 'nexus_pm_token';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export const setToken   = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken   = ()      => localStorage.getItem(TOKEN_KEY);
export const clearToken = ()      => localStorage.removeItem(TOKEN_KEY);

export default api;
