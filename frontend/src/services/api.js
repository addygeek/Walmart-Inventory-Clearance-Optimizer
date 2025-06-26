const API_BASE_URL = 'https://addywalmart.pythonanywhere.com/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.baseURL = API_BASE_URL;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const method = options.method || 'GET';
    const config = {
      method,
      headers: this.getHeaders(),
      mode: 'cors',
      credentials: 'include',
      ...options,
    };

    // Avoid setting 'body' for GET or HEAD requests
    if (['GET', 'HEAD'].includes(method.toUpperCase())) {
      delete config.body;
    }

    try {
      const response = await fetch(url, config);

      if (!response || response.status === 0) {
        throw new Error('Network error or blocked by CORS policy');
      }

      const contentType = response.headers.get('Content-Type') || '';
      const isJSON = contentType.includes('application/json');
      const data = isJSON ? await response.json().catch(() => null) : null;

      if (!response.ok) {
        const errorMsg = data?.error || `Request failed: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return data ?? {};
    } catch (error) {
      console.error(`❌ API error [${method} ${url}]:`, error.message);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Auth methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Product methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);

    if (response?.database_empty) {
      console.warn('⚠️ Database is empty, no real data available');
    } else {
      console.log('✅ Loaded real data from MongoDB:', response?.message);
    }

    return response;
  }

  async getProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  async addProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId, productData) {
    return this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId) {
    return this.request(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Interactions
  async addInteraction(interactionData) {
    try {
      const response = await this.request('/interactions', {
        method: 'POST',
        body: JSON.stringify(interactionData),
      });

      if (!response?.can_sell && interactionData.actionType === 'bought') {
        throw new Error(response?.error || 'Cannot complete sale - insufficient stock');
      }

      return response;
    } catch (error) {
      if (error.message.includes('Insufficient stock') || error.message.includes('out of stock')) {
        throw new Error(`❌ ${error.message}`);
      }
      throw error;
    }
  }

  async getInteractions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/interactions?${queryString}`);
  }

  // Database
  async getDatabaseStatus() {
    return this.request('/database/status');
  }

  async populateDatabase() {
    try {
      const response = await this.request('/database/populate', {
        method: 'POST',
      });
      console.log('✅ Database populated:', response?.message);
      return response;
    } catch (error) {
      console.error('❌ Failed to populate database:', error.message);
      throw error;
    }
  }

  // Recommendations
  async getRecommendations(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/recommendations/${userId}?${queryString}`);
  }

  // Analytics
  async getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  // Bulk operations
  async bulkOperations(operationData) {
    const response = await this.request('/products/bulk', {
      method: 'POST',
      body: JSON.stringify(operationData),
    });

    const stockErrors = response?.results?.filter(r => r.error && r.error.includes('stock'));
    if (stockErrors?.length) {
      console.warn('⚠️ Stock issues detected in bulk operation:', stockErrors);
    }

    return response;
  }
}

export default new ApiService();
