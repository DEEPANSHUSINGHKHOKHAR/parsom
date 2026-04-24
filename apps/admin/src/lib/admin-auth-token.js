const ADMIN_AUTH_STORAGE_KEY = 'parsom-admin-auth';

export function getStoredAdminAuthToken() {
  try {
    const rawValue = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

    if (!rawValue) return '';

    const parsedValue = JSON.parse(rawValue);
    return parsedValue?.state?.token || '';
  } catch {
    return '';
  }
}