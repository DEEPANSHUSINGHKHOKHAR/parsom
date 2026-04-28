import axios from 'axios';

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const cleanUrl = configuredUrl.replace(/\/+$/, '');

  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
