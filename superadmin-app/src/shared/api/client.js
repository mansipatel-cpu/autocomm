import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1/superadmin';

export const superAdminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

superAdminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('autocomm_superadmin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

superAdminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('autocomm_superadmin_token');
      localStorage.removeItem('autocomm_superadmin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
