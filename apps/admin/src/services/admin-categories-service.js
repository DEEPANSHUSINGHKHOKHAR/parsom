import apiClient from '../lib/api-client';

export async function fetchAdminCategories() {
  const { data } = await apiClient.get('/admin/categories');
  return data?.data || [];
}

export async function createAdminCategory(payload) {
  const { data } = await apiClient.post('/admin/categories', payload);
  return data?.data || {};
}

export async function updateAdminCategory(categoryId, payload) {
  const { data } = await apiClient.patch(`/admin/categories/${categoryId}`, payload);
  return data?.data || {};
}

export async function deleteAdminCategory(categoryId) {
  const { data } = await apiClient.delete(`/admin/categories/${categoryId}`);
  return data?.data || {};
}