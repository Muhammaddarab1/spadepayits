// Axios instance configured with environment-based API URL
// - In development, VITE_API_URL is empty and Vite proxies "/api" to backend
// - In production, set VITE_API_URL to your Render backend URL
import axios from 'axios';
const base = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = base;
axios.defaults.withCredentials = true;

// Request interceptor: Add token from storage to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Capture token from response body or headers
axios.interceptors.response.use(
  (response) => {
    // Capture token from response body (password change, login, etc.)
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    // Also check response headers as fallback
    else if (response.headers['x-auth-token']) {
      localStorage.setItem('authToken', response.headers['x-auth-token']);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.headers['x-auth-token']}`;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default axios;
