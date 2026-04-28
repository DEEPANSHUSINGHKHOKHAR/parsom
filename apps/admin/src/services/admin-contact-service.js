import apiClient from '../lib/api-client';

export async function fetchAdminContactSubmissions(params = {}) {
  const { data } = await apiClient.get('/admin/contact-submissions', { params });
  return data?.data || [];
}

export async function updateAdminContactSubmission(contactSubmissionId, payload) {
  const { data } = await apiClient.patch(
    `/admin/contact-submissions/${contactSubmissionId}`,
    payload
  );
  return data?.data || {};
}