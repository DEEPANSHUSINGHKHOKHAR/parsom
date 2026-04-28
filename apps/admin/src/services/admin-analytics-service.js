import apiClient from '../lib/api-client';

export async function fetchAdminAnalyticsOverview() {
  const { data } = await apiClient.get('/admin/analytics/overview');
  return data?.data || null;
}