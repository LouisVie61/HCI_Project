// API Client setup
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';
const AUTH_STORAGE_KEY = 'access_token';
const USER_STORAGE_KEY = 'user';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

const getStoredToken = () => {
  const rawToken = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawToken) return null;

  try {
    const parsedToken = JSON.parse(rawToken);
    return typeof parsedToken === 'string' ? parsedToken : rawToken;
  } catch {
    return rawToken;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event('auth:logout'));
};

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>;
      message?: string;
    };

    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg;
    }
    return data.message || `API Error: ${response.status}`;
  } catch {
    return `API Error: ${response.status}`;
  }
};

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      if (response.status === 401) {
        clearAuthStorage();
      }
      return { error: errorMessage, status: response.status };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, status: 500 };
  }
}

export const api = {
  get: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'GET' }),

  post: <T,>(endpoint: string, body: unknown) =>
    apiCall<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T,>(endpoint: string, body: unknown) =>
    apiCall<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  postForm: <T,>(endpoint: string, body: FormData) =>
    apiCall<T>(endpoint, { method: 'POST', body }),

  delete: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
};

export default api;
