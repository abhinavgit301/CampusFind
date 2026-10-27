const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

const TOKEN_KEY = 'campusfind_access_token';
const REFRESH_TOKEN_KEY = 'campusfind_refresh_token';

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const setAuthTokens = (token: string | null, refreshToken?: string | null) => {
  inMemoryToken = token;
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (_e) {}
  } else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_e) {}
  }

  if (refreshToken !== undefined) {
    inMemoryRefreshToken = refreshToken;
    if (refreshToken) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } catch (_e) {}
    } else {
      try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch (_e) {}
    }
  }
};

export const getAuthToken = (): string | null => {
  if (inMemoryToken) return inMemoryToken;
  try {
    inMemoryToken = localStorage.getItem(TOKEN_KEY);
  } catch (_e) {}
  return inMemoryToken;
};

export const getRefreshToken = (): string | null => {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  try {
    inMemoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (_e) {}
  return inMemoryRefreshToken;
};

export const clearAuthTokens = () => {
  setAuthTokens(null, null);
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

async function customFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const defaultHeaders: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized and not already on the refresh or login endpoint
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    if (isRefreshing) {
      // Queue the request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        const freshToken = getAuthToken();
        const retryHeaders = { ...(config.headers as Record<string, string>) };
        if (freshToken) {
          retryHeaders['Authorization'] = `Bearer ${freshToken}`;
        }
        return fetch(url, { ...config, headers: retryHeaders });
      });
    }

    isRefreshing = true;

    try {
      const storedRefreshToken = getRefreshToken();
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json().catch(() => null);
        if (refreshData?.token) {
          setAuthTokens(refreshData.token, refreshData.refreshToken);
        }
        processQueue(null);

        // Retry the original request with the fresh token
        const freshToken = getAuthToken();
        const retryHeaders = { ...(config.headers as Record<string, string>) };
        if (freshToken) {
          retryHeaders['Authorization'] = `Bearer ${freshToken}`;
        }
        response = await fetch(url, { ...config, headers: retryHeaders });
      } else {
        clearAuthTokens();
        processQueue(new Error('Session expired'));
      }
    } catch (refreshErr) {
      clearAuthTokens();
      processQueue(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

async function parseResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;

  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch (_e) {
      // Body is not JSON (e.g. proxy HTML error or plain text)
      data = null;
    }
  }

  if (!res.ok) {
    if (data && (data.error || data.message)) {
      throw new Error(data.error || data.message);
    }
    if (res.status === 502 || res.status === 503 || res.status === 504 || !text.trim()) {
      throw new Error('Backend server is offline or unreachable. Please verify the API server status.');
    }
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return (data !== null ? data : ({} as T));
}

export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    const res = await customFetch(endpoint, { method: 'GET' });
    return parseResponse<T>(res);
  },

  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await customFetch(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
    return parseResponse<T>(res);
  },

  async patch<T = any>(endpoint: string, body: any): Promise<T> {
    const res = await customFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return parseResponse<T>(res);
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const res = await customFetch(endpoint, { method: 'DELETE' });
    return parseResponse<T>(res);
  },

  async uploadFile(file: File): Promise<{ key: string; url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData);
  },
};
