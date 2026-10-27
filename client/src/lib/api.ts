const API_BASE = '/api/v1';

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

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized and not already on the refresh endpoint
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    if (isRefreshing) {
      // Queue the request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => fetch(url, config));
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        processQueue(null);
        // Retry the original request
        response = await fetch(url, config);
      } else {
        processQueue(new Error('Session expired'));
      }
    } catch (refreshErr) {
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
      throw new Error('Backend server is offline or unreachable on port 4001. Please make sure "npm run dev" is running in the server directory.');
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
