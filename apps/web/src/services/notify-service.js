import apiClient from '../lib/api-client';

export async function createNotifyRequest(payload) {
  const { data } = await apiClient.post('/notify-requests', payload);
  return data?.data || {};
}

export async function fetchMyNotifyRequests() {
  const { data } = await apiClient.get('/notify-requests/my');
  return data?.data || [];
}