import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  // @ts-expect-error - Ignore the type error for import.meta.env
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically add authentication headers
api.interceptors.request.use(
  (config) => {
    // AUTHENTICATION TEMPORARILY DISABLED
    // Add a fake token for all requests
    config.headers['Authorization'] = 'Bearer fake-test-token';
    console.log('🔍 CLIENT API: Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      baseURL: config.baseURL,
      params: config.params
    });
    return config;
  },
  (error) => {
    console.error('🔍 CLIENT API: Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log('🔍 CLIENT API: Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'not an array'
    });
    return response;
  },
  (error) => {
    console.error('🔍 CLIENT API: Response Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default api; 