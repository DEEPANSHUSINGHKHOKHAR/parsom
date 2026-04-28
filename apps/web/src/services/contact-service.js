import apiClient from '../lib/api-client';

export async function createContactSubmission(payload) {
  const { data } = await apiClient.post('/contact-submissions', payload);
  return data?.data || {};
}