import apiClient from '../lib/api-client';

const normalizeListResponse = (payload) => ({
  items: payload?.data?.items ?? payload?.items ?? [],
  filters: payload?.data?.filters ?? payload?.filters ?? { categories: [] },
  pagination: payload?.data?.pagination ?? payload?.pagination ?? null,
});

const normalizeDetailResponse = (payload) => ({
  item: payload?.data?.item ?? payload?.item ?? null,
  relatedItems: payload?.data?.relatedItems ?? payload?.relatedItems ?? [],
});

export async function fetchProducts(params = {}) {
  const { data } = await apiClient.get('/products', { params });
  return normalizeListResponse(data);
}

export async function fetchProductBySlug(slug) {
  const { data } = await apiClient.get(`/products/${slug}`);
  return normalizeDetailResponse(data);
}