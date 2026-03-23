import axios from 'axios';
const base = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = base;
axios.defaults.withCredentials = true;

export default axios;
