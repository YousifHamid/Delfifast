import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('delifast_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('delifast_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  setupTwoFactor: (setupToken) =>
    api.post('/auth/2fa/setup', {}, { headers: { Authorization: `Bearer ${setupToken}` } }).then((r) => r.data),
  confirmTwoFactor: (setupToken, totpCode) =>
    api.post('/auth/2fa/confirm', { totpCode }, { headers: { Authorization: `Bearer ${setupToken}` } }).then((r) => r.data),
};

export const AdminAPI = {
  pendingVendors: () => api.get('/admin/vendors/pending').then((r) => r.data),
  approveVendor: (id) => api.post(`/admin/vendors/${id}/approve`).then((r) => r.data),
  suspendVendor: (id, reason) => api.post(`/admin/vendors/${id}/suspend`, { reason }).then((r) => r.data),

  users: (search) => api.get('/admin/users', { params: { search } }).then((r) => r.data),
  suspendUser: (id, reason) => api.post(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data),
  changeUserRole: (id, role) => api.post(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  orders: (status) => api.get('/admin/orders', { params: { status } }).then((r) => r.data),

  featureFlags: () => api.get('/admin/feature-flags').then((r) => r.data),
  setFeatureFlag: (key, isEnabled) => api.post(`/admin/feature-flags/${key}`, { isEnabled }).then((r) => r.data),

  auditLog: () => api.get('/admin/audit-log').then((r) => r.data),
};
