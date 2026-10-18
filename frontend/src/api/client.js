import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const apiUrl = new URL(
  configuredApiUrl || `http://${window.location.hostname}:8000/api/v1`,
);
const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);

if (
  loopbackHosts.has(apiUrl.hostname) &&
  loopbackHosts.has(window.location.hostname)
) {
  apiUrl.hostname = window.location.hostname;
}

const api = axios.create({
  baseURL: apiUrl.toString().replace(/\/$/, ''),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ats_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ats_token');
      localStorage.removeItem('ats_user');
      window.dispatchEvent(new Event('ats:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
