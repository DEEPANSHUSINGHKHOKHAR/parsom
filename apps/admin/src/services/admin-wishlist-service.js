import apiClient from '../lib/api-client';

export async function fetchAdminWishlistInsights(params = {}) {
  const { data } = await apiClient.get('/admin/wishlist-insights', { params });
  return data?.data || [];
}