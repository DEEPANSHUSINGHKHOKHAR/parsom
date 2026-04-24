import axios from 'axios';
import { getStoredAdminAuthToken } from './admin-auth-token';

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const cleanUrl = configuredUrl.replace(/\/+$/, '');

  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAdminAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
