import apiClient from '../lib/api-client';

export async function adminLogin(payload) {
  const { data } = await apiClient.post('/auth/admin/login', payload);
  return data?.data || {};
}

export async function fetchCurrentAdmin() {
  const { data } = await apiClient.get('/auth/me');
  return data?.data || null;
}