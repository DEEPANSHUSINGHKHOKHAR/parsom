import apiClient from '../lib/api-client';

export async function registerUser(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data?.data || {};
}

export async function loginUser(payload) {
  const { data } = await apiClient.post('/auth/login', payload);
  return data?.data || {};
}

export async function checkPhoneAccount(payload) {
  const { data } = await apiClient.post('/auth/phone/check', payload);
  return data?.data || {};
}

export async function loginUserWithPhone(payload) {
  const { data } = await apiClient.post('/auth/phone/login', payload);
  return data?.data || {};
}

export async function loginWithGoogle(payload) {
  const { data } = await apiClient.post('/auth/google', payload);
  return data?.data || {};
}

export async function fetchCurrentActor() {
  const { data } = await apiClient.get('/auth/me');
  return data?.data || null;
}

export async function changePassword(payload) {
  const { data } = await apiClient.post('/auth/password/change', payload);
  return data?.data || {};
}

export async function deleteMyAccount(payload) {
  const { data } = await apiClient.delete('/auth/me', { data: payload });
  return data?.data || {};
}
