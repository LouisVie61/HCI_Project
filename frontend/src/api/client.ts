// API Client setup
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

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
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        // Redirect to login if needed
      }
      throw new Error(`API Error: ${response.status}`);
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

  post: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
};

export default api;
