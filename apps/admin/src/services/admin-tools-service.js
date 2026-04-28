import apiClient from '../lib/api-client';

function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadOrdersCsv() {
  const response = await apiClient.get('/admin/tools/exports/orders.csv', {
    responseType: 'blob',
  });

  triggerBlobDownload(response.data, 'orders.csv');
}

export async function downloadNotifyRequestsCsv() {
  const response = await apiClient.get('/admin/tools/exports/notify-requests.csv', {
    responseType: 'blob',
  });

  triggerBlobDownload(response.data, 'notify-requests.csv');
}

export async function uploadAdminMedia(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/admin/tools/uploads/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data?.data || {};
}