const API_BASE_URL = 'http://localhost:5000/api';

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
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Auth methods (for future real authentication)
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
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
      const response = await this.request(endpoint);
      
      // Check if database is empty
      if (response.database_empty) {
        console.warn('⚠️ Database is empty, no real data available');
      } else {
        console.log('✅ Loaded real data from MongoDB:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
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

  // Interaction methods
async addInteraction(interactionData) {
    try {
      const response = await this.request('/interactions', {
        method: 'POST',
        body: JSON.stringify(interactionData),
      });
      
      // Check if the action was successful
      if (!response.can_sell && interactionData.actionType === 'bought') {
        throw new Error(response.error || 'Cannot complete sale - insufficient stock');
      }
      
      return response;
    } catch (error) {
      // Re-throw with more specific error message
      if (error.message.includes('Insufficient stock') || error.message.includes('out of stock')) {
        throw new Error(`❌ ${error.message}`);
      }
      throw error;
    }
  }
  async getDatabaseStatus() {
    return this.request('/database/status');
  }

  async getInteractions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/interactions?${queryString}`);
  }

  // Recommendation methods
  async getRecommendations(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/recommendations/${userId}?${queryString}`);
  }

  // Analytics methods
  async getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }
  async populateDatabase() {
    return this.request('/database/populate', {
      method: 'POST',
    });
  }
  // Bulk operations
  async bulkOperations(operationData) {
    try {
      const response = await this.request('/products/bulk', {
        method: 'POST',
        body: JSON.stringify(operationData),
      });
      
      // Check for any stock-related errors in bulk operations
      const stockErrors = response.results?.filter(r => r.error && r.error.includes('stock'));
      if (stockErrors && stockErrors.length > 0) {
        console.warn('Some items had stock issues:', stockErrors);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApiService();
