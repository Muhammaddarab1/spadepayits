import axios from 'axios';
const base = import.meta.env.VITE_API_URL || '';
const instance = axios.create({
  baseURL: base,
  withCredentials: true
});

// Add a request interceptor to include the token in the Authorization header
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
