import apiClient from '../lib/api-client';

export async function uploadReviewImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/uploads/review-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data?.data || {};
}
