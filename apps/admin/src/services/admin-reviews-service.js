import apiClient from '../lib/api-client';

export async function fetchAdminReviews(params = {}) {
  const { data } = await apiClient.get('/admin/reviews', { params });
  return data?.data || [];
}

export async function updateAdminReviewPublishState(reviewId, payload) {
  const { data } = await apiClient.patch(
    `/admin/reviews/${reviewId}/publish`,
    payload
  );
  return data?.data || {};
}

export async function deleteAdminReview(reviewId) {
  const { data } = await apiClient.delete(`/admin/reviews/${reviewId}`);
  return data?.data || {};
}