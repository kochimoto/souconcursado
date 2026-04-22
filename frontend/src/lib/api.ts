import axios from 'axios';

const api = axios.create({
  // Usa caminho relativo (/api) para aproveitar os Route Handlers nativos do Next.js
  // sem precisar de CORS. NEXT_PUBLIC_API_URL pode sobrescrever em ambientes customizados.
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
