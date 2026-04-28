import apiClient from '../lib/api-client';

export async function fetchAdminStorefrontSettings() {
  const { data } = await apiClient.get('/admin/storefront/settings');
  return data?.data || { velocityBanner: { entries: [] } };
}

export async function updateAdminStorefrontSettings(payload) {
  const { data } = await apiClient.patch('/admin/storefront/settings', payload);
  return data?.data || {};
}
