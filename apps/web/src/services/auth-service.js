import apiClient from '../lib/api-client';

export async function registerUser(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data?.data || {};
}

export async function loginUser(payload) {
  const { data } = await apiClient.post('/auth/login', payload);
  return data?.data || {};
}

export async function fetchCurrentActor() {
  const { data } = await apiClient.get('/auth/me');
  return data?.data || null;
}
export async function requestPasswordResetOtp(payload) {
  const { data } = await apiClient.post('/auth/forgot-password/request-otp', payload);
  return data?.data || {};
}

export async function resetPasswordWithOtp(payload) {
  const { data } = await apiClient.post('/auth/forgot-password/reset', payload);
  return data?.data || {};
}

export async function requestWhatsappLoginOtp(payload) {
  const { data } = await apiClient.post('/auth/whatsapp/request-otp', payload);
  return data?.data || {};
}

export async function verifyWhatsappLoginOtp(payload) {
  const { data } = await apiClient.post('/auth/whatsapp/verify-otp', payload);
  return data?.data || {};
}
