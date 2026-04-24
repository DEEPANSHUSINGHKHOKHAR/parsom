import apiClient from '../lib/api-client';

export async function fetchMyWishlist() {
  const { data } = await apiClient.get('/wishlist');
  return data?.data || [];
}

export async function addWishlistItem(productId) {
  const { data } = await apiClient.post('/wishlist', { productId });
  return data?.data || {};
}

export async function removeWishlistItem(productId) {
  const { data } = await apiClient.delete(`/wishlist/${productId}`);
  return data?.data || {};
}