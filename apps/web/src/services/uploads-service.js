import apiClient from '../lib/api-client';

const REVIEW_IMAGE_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export async function uploadReviewImage(file) {
  if (file.size > REVIEW_IMAGE_MAX_SIZE_BYTES) {
    throw new Error('Review images must be 20 MB or smaller.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image uploads are supported for reviews.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/uploads/review-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data?.data || {};
}

export const uploadReviewMedia = uploadReviewImage;
