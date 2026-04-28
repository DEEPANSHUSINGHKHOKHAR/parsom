import apiClient from '../lib/api-client';

export async function fetchAdminProducts(params = {}) {
  const { data } = await apiClient.get('/admin/products', { params });
  return data?.data || [];
}

export async function fetchDeletedAdminProducts() {
  const { data } = await apiClient.get('/admin/products/deleted');
  return data?.data || [];
}

export async function fetchAdminProductById(productId) {
  const { data } = await apiClient.get(`/admin/products/${productId}`);
  return data?.data || null;
}

export async function createAdminProduct(payload) {
  const { data } = await apiClient.post('/admin/products', payload);
  return data?.data || {};
}

export async function updateAdminProduct(productId, payload) {
  const { data } = await apiClient.patch(`/admin/products/${productId}`, payload);
  return data?.data || {};
}

export async function deleteAdminProduct(productId) {
  const { data } = await apiClient.delete(`/admin/products/${productId}`);
  return data?.data || {};
}

export async function restoreAdminProduct(productId) {
  const { data } = await apiClient.patch(`/admin/products/${productId}/restore`);
  return data?.data || {};
}

export async function permanentlyDeleteAdminProduct(productId) {
  const { data } = await apiClient.delete(`/admin/products/${productId}/permanent`);
  return data?.data || {};
}
