import apiClient from '../lib/api-client';

export async function fetchAdminOrders(params = {}) {
  const { data } = await apiClient.get('/admin/orders', { params });
  return data?.data || [];
}

export async function fetchAdminOrderByNumber(orderNumber) {
  const { data } = await apiClient.get(`/admin/orders/${orderNumber}`);
  return data?.data || null;
}

export async function updateAdminOrderStatus(orderNumber, payload) {
  const { data } = await apiClient.patch(
    `/admin/orders/${orderNumber}/status`,
    payload
  );
  return data?.data || {};
}