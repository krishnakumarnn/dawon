import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : {}),
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
