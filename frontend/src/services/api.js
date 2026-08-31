/**
 * Centralized API Client with JWT Bearer Token Support & Error Handling
 *
 * API_BASE resolution:
 *  - If VITE_API_URL env var is set (e.g. on Vercel), use that.
 *  - Otherwise default to relative '/api/v1' so it works on both
 *    localhost dev (via Vite proxy) and Render (same-origin Docker).
 */
const rawBase = import.meta.env.VITE_API_URL || '/api/v1';

// Normalize: trim whitespace, strip trailing slashes, ensure /api/v1 suffix
const normalizeApiBase = (url) => {
  let clean = (url || '').trim();
  // If a full URL was provided, extract from the scheme onward
  if (clean.includes('http://') || clean.includes('https://')) {
    clean = clean.slice(clean.indexOf('http'));
  }
  clean = clean.replace(/\/+$/, '');
  if (!clean.endsWith('/api/v1')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
};

const API_BASE = normalizeApiBase(rawBase);



let warmingUpCount = 0;

class ApiClient {
  getToken() {
    return localStorage.getItem('restockai_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('restockai_token', token);
    } else {
      localStorage.removeItem('restockai_token');
    }
  }

  async request(endpoint, options = {}, isRetry = false) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Timeout: 60s default for normal requests to tolerate Render free-tier cold starts, 120s for batch predictions
    const timeoutMs = endpoint.includes('/batch') ? 120000 : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config = {
      ...options,
      headers,
      signal: controller.signal
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      // Handle 401 Unauthorized (expired / invalid token)
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorDetail = data.detail || (typeof data === 'string' ? data : 'An unexpected error occurred.');
        throw new Error(errorDetail);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      const isTimeout = error.name === 'AbortError';
      const isNetwork = error.message === 'Failed to fetch' || error.message?.includes('NetworkError');

      // Retry once after a short delay on timeout or network errors to handle sleeping free-tier Render instances
      if ((isTimeout || isNetwork) && !isRetry) {
        console.warn(`Request to ${endpoint} failed (Timeout/Network). Retrying once due to potential Render cold-start...`);
        
        if (warmingUpCount === 0) {
          window.dispatchEvent(new CustomEvent('api:warming-up'));
        }
        warmingUpCount++;

        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          const retryData = await this.request(endpoint, options, true);
          warmingUpCount--;
          if (warmingUpCount === 0) {
            window.dispatchEvent(new CustomEvent('api:warmed-up'));
          }
          return retryData;
        } catch (retryError) {
          warmingUpCount--;
          if (warmingUpCount === 0) {
            window.dispatchEvent(new CustomEvent('api:warmed-up'));
          }
          throw retryError;
        }
      }

      if (error.name === 'AbortError') {
        console.error(`API Timeout on [${options.method || 'GET'} ${endpoint}]: Request took longer than ${timeoutMs / 1000}s`);
        throw new Error('Request timed out. Please check that the backend server is running and try again.');
      }
      if (error.message === 'Failed to fetch' || error.message?.includes('NetworkError')) {
        console.error(`API Network Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
        throw new Error('Cannot connect to the server. Please check that the backend is running.');
      }
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  // ================= Auth Endpoints =================
  auth = {
    register: (payload) => this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    login: (payload) => this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    me: () => this.request('/auth/me'),
    forgotPassword: (payload) => this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    resetPassword: (payload) => this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  };

  // ================= Predictions Endpoints =================
  predictions = {
    create: (inputData) => this.request('/predictions', {
      method: 'POST',
      body: JSON.stringify({ input_data: inputData })
    }),
    createBatch: (items) => this.request('/predictions/batch', {
      method: 'POST',
      body: JSON.stringify({ items })
    }),
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category && params.category !== 'ALL') query.append('category', params.category);
      if (params.page) query.append('page', params.page);
      if (params.page_size) query.append('page_size', params.page_size);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request(`/predictions${qs}`);
    },
    get: (id) => this.request(`/predictions/${id}`),
    delete: (id) => this.request(`/predictions/${id}`, { method: 'DELETE' })
  };

  // ================= User Datasets Endpoints =================
  userData = {
    save: (title, inputData) => this.request('/user-data', {
      method: 'POST',
      body: JSON.stringify({ title, input_data: inputData })
    }),
    list: () => this.request('/user-data'),
    delete: (id) => this.request(`/user-data/${id}`, { method: 'DELETE' })
  };

  // ================= ML Model Schema =================
  model = {
    getSchema: () => this.request('/model/schema')
  };

  // ================= Retail Store Reorder Endpoints =================
  stores = {
    list: () => this.request('/stores'),
    getRecommendations: (storeId, category, urgency) => {
      const query = new URLSearchParams();
      if (category && category !== 'ALL') query.append('category', category);
      if (urgency && urgency !== 'ALL') query.append('urgency_filter', urgency);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request(`/recommendations/${storeId}${qs}`);
    },
    getItemDetail: (storeId, itemId) => this.request(`/recommendations/${storeId}/${itemId}`),
    exportSheets: (storeId, title) => this.request(`/export/sheets/${storeId}`, {
      method: 'POST',
      body: JSON.stringify({ spreadsheet_title: title })
    }),
    triggerRetrain: (maxPairs = 100) => this.request(`/forecast/train?max_pairs=${maxPairs}`, {
      method: 'POST'
    })
  };

  // ================= System Endpoints =================
  system = {
    health: () => this.request('/health')
  };
}

export const api = new ApiClient();
export default api;
