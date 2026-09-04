import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 180000, // Increased to 3 minutes for heavy AI processing
  withCredentials: true,
  xsrfCookieName: 'csrf_access_token',
  xsrfHeaderName: 'X-CSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const match = document.cookie.match(new RegExp('(^| )csrf_access_token=([^;]+)'));
    if (match) {
      config.headers['X-CSRF-TOKEN'] = match[2];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect on /auth/me checks (expected to 401 when not logged in)
      // Don't redirect if already on the login page (prevents infinite loop)
      const requestUrl = error.config?.url || '';
      const isAuthCheck = requestUrl.includes('/auth/me');
      const isOnLoginPage = window.location.pathname === '/login';
      
      if (!isAuthCheck && !isOnLoginPage) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. The server may be processing a large image — please try again.');
    }
    return Promise.reject(error);
  }
);

export default api;
