/**
 * Centralized API Client with JWT Bearer Token Support & Error Handling
 */
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Normalize API_BASE: trim whitespace, remove trailing slashes, ensure correct scheme
const normalizeApiBase = (url) => {
  let clean = (url || '').trim();
  // Strip any accidental leading relative path if pasted like /api/v1http...
  if (clean.includes('http://') || clean.includes('https://')) {
    const httpIndex = clean.indexOf('http');
    clean = clean.slice(httpIndex);
  }
  clean = clean.replace(/\/+$/, '');
  // If user provided base without /api/v1, append it
  if (!clean.endsWith('/api/v1')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
};

const API_BASE = normalizeApiBase(rawBase);


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

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
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
