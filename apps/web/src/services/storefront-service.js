import apiClient from '../lib/api-client';

export async function fetchStorefrontSettings() {
  const { data } = await apiClient.get('/storefront/settings');
  return data?.data || { velocityBanner: { entries: [] } };
}
