import apiClient from '../lib/api-client';

export async function fetchAdminReturnRequests(params = {}) {
  const { data } = await apiClient.get('/admin/return-requests', { params });
  return data?.data || [];
}

export async function updateAdminReturnRequest(returnRequestId, payload) {
  const { data } = await apiClient.patch(
    `/admin/return-requests/${returnRequestId}`,
    payload
  );
  return data?.data || {};
}
