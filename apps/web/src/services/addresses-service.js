import apiClient from '../lib/api-client';

export async function fetchMyAddresses() {
  const { data } = await apiClient.get('/addresses');
  return data?.data || [];
}

export async function createAddress(payload) {
  const { data } = await apiClient.post('/addresses', payload);
  return data?.data || {};
}

export async function updateAddress(addressId, payload) {
  const { data } = await apiClient.patch(`/addresses/${addressId}`, payload);
  return data?.data || {};
}

export async function setDefaultAddress(addressId) {
  const { data } = await apiClient.patch(`/addresses/${addressId}/default`);
  return data?.data || {};
}

export async function deleteAddress(addressId) {
  const { data } = await apiClient.delete(`/addresses/${addressId}`);
  return data?.data || {};
}