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

const csrfStorageKey = 'parsom-admin-csrf';

function setCsrfToken(token) {
  if (!token) return;
  sessionStorage.setItem(csrfStorageKey, token);
}

function getCsrfToken() {
  return sessionStorage.getItem(csrfStorageKey) || '';
}

apiClient.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toUpperCase();
  const csrfToken = getCsrfToken();

  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

function captureCsrfToken(response) {
  const headerToken = response?.headers?.['x-csrf-token'];
  const bodyToken = response?.data?.data?.csrfToken;

  if (headerToken) {
    setCsrfToken(headerToken);
  } else if (bodyToken) {
    setCsrfToken(bodyToken);
  }
}

apiClient.interceptors.response.use(
  (response) => {
    captureCsrfToken(response);
    return response;
  },
  (error) => {
    captureCsrfToken(error?.response);
    return Promise.reject(error);
  }
);

export default apiClient;
