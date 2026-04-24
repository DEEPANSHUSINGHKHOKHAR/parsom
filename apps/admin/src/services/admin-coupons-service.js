import apiClient from '../lib/api-client';

export async function fetchAdminCoupons() {
  const { data } = await apiClient.get('/admin/coupons');
  return data?.data || [];
}

export async function createAdminCoupon(payload) {
  const { data } = await apiClient.post('/admin/coupons', payload);
  return data?.data || {};
}

export async function updateAdminCoupon(couponId, payload) {
  const { data } = await apiClient.patch(`/admin/coupons/${couponId}`, payload);
  return data?.data || {};
}

export async function deleteAdminCoupon(couponId) {
  const { data } = await apiClient.delete(`/admin/coupons/${couponId}`);
  return data?.data || {};
}