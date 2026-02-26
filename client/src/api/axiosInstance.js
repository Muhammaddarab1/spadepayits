// Axios instance configured with environment-based API URL
// - In development, VITE_API_URL is empty and Vite proxies "/api" to backend
// - In production, set VITE_API_URL to your Render backend URL
import axios from 'axios';
const base = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = base;
axios.defaults.withCredentials = true;
export default axios;
