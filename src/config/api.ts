const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredApiBaseUrl || '').replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
};

