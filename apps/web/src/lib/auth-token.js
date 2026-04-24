const AUTH_STORAGE_KEY = 'parsom-auth';

export function getStoredAuthToken() {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawValue) return '';

    const parsedValue = JSON.parse(rawValue);
    return parsedValue?.state?.token || '';
  } catch {
    return '';
  }
}