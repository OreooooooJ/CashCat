import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  // @ts-expect-error - Ignore the type error for import.meta.env
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:5000',
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 