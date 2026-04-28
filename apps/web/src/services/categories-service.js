import apiClient from '../lib/api-client';

export async function fetchCollectionCategories() {
  const { data } = await apiClient.get('/products/categories');
  return Array.isArray(data?.data) ? data.data : [];
}
