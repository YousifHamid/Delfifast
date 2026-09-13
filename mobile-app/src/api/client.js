import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Point this at your deployed backend (see /backend README).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('delifast_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function setAuthToken(token) {
  await SecureStore.setItemAsync('delifast_token', token);
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync('delifast_token');
}

// --- Endpoint helpers (thin wrappers, keep screens simple) ---
export const VendorsAPI = {
  list: (params) => api.get('/vendors', { params }).then((r) => r.data),
  get: (id) => api.get(`/vendors/${id}`).then((r) => r.data),
  publicFeatureFlags: () => api.get('/vendors/meta/feature-flags').then((r) => r.data),
};

export const OrdersAPI = {
  place: (payload) => api.post('/orders', payload).then((r) => r.data),
  list: () => api.get('/orders').then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
};

export const AuthAPI = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
};
