import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('delifast_vendor_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('delifast_vendor_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
};

export const VendorPanelAPI = {
  orders: (vendorId) => api.get(`/vendor-panel/vendors/${vendorId}/orders`).then((r) => r.data),
  updateOrderStatus: (vendorId, orderId, status) =>
    api.patch(`/vendor-panel/vendors/${vendorId}/orders/${orderId}/status`, { status }).then((r) => r.data),
  addCategory: (vendorId, name) =>
    api.post(`/vendor-panel/vendors/${vendorId}/categories`, { name }).then((r) => r.data),
  addProduct: (vendorId, payload) =>
    api.post(`/vendor-panel/vendors/${vendorId}/products`, payload).then((r) => r.data),
  updateProduct: (vendorId, productId, payload) =>
    api.patch(`/vendor-panel/vendors/${vendorId}/products/${productId}`, payload).then((r) => r.data),
};

export const VendorsAPI = {
  get: (id) => api.get(`/vendors/${id}`).then((r) => r.data),
};
