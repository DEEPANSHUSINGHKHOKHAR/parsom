import apiClient from '../lib/api-client';

export async function createOrder(payload) {
  const { data } = await apiClient.post('/orders', payload);
  return data?.data || {};
}

export async function fetchMyOrders() {
  const { data } = await apiClient.get('/orders/my');
  return data?.data || [];
}

export async function fetchMyOrderByNumber(orderNumber) {
  const { data } = await apiClient.get(`/orders/my/${orderNumber}`);
  return data?.data || null;
}
export async function downloadMyInvoice(orderNumber) {
  const response = await apiClient.get(`/orders/my/${orderNumber}/invoice.pdf`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${orderNumber}-invoice.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
