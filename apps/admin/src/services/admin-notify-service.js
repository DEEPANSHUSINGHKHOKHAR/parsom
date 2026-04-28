import apiClient from '../lib/api-client';

export async function fetchAdminNotifyRequests(params = {}) {
  const { data } = await apiClient.get('/admin/notify-requests', { params });
  return data?.data || [];
}

export async function updateAdminNotifyStatus(notifyRequestId, payload) {
  const { data } = await apiClient.patch(
    `/admin/notify-requests/${notifyRequestId}/status`,
    payload
  );
  return data?.data || {};
}