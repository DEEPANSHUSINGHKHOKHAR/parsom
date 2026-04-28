import apiClient from '../lib/api-client';

export async function validateCoupon(payload) {
  const { data } = await apiClient.post('/coupons/validate', payload);
  return data?.data || {};
}
