import axios from 'axios';

const BASE_URL = 'https://pmsapi.site2demo.in/api';
const TOKEN_KEY = 'nexus_pm_token';

/* ── Axios instance ─────────────────────────────────────────── */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/* ── Request interceptor — attach Bearer token ──────────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Response interceptor — handle 401 globally ─────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and reload to /login
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

/* ── Token helpers ───────────────────────────────────────────── */
export const setToken  = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken  = ()      => localStorage.getItem(TOKEN_KEY);
export const clearToken= ()      => localStorage.removeItem(TOKEN_KEY);

export default api;
