import apiClient from '../lib/api-client';

export async function fetchMyReviews() {
  const { data } = await apiClient.get('/reviews/my');
  return data?.data || [];
}

export async function fetchEligibleReviewItems() {
  const { data } = await apiClient.get('/reviews/eligible');
  return data?.data || [];
}

export async function createReview(payload) {
  const { data } = await apiClient.post('/reviews', payload);
  return data?.data || {};
}

export async function updateReview(reviewId, payload) {
  const { data } = await apiClient.patch(`/reviews/${reviewId}`, payload);
  return data?.data || {};
}

export async function deleteReview(reviewId) {
  const { data } = await apiClient.delete(`/reviews/${reviewId}`);
  return data?.data || {};
}
