// Axios instance configured with environment-based API URL
// - In development, VITE_API_URL is empty and Vite proxies "/api" to backend
// - In production, set VITE_API_URL to your Render backend URL
import axios from 'axios';
const base = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = base;
axios.defaults.withCredentials = true;

// Interceptor to handle auth token from response headers (for password change)
axios.interceptors.response.use(
  (response) => {
    if (response.headers['x-auth-token']) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.headers['x-auth-token']}`;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default axios;
