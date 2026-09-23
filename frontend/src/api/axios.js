import axios from 'axios';

const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '');
const API_URL = apiOrigin ? `${apiOrigin}/api` : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');
const storage = sessionStorage;

// Render's free API can need up to about a minute to wake after inactivity.
export const api = axios.create({ baseURL: API_URL, timeout: 75000 });

api.interceptors.request.use((config) => {
  const token = storage.getItem('apild_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const refreshToken = storage.getItem('apild_refresh_token');
    if (error.response?.status !== 401 || request?._retry || !refreshToken || request?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    request._retry = true;
    refreshing ||= axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        const tokens = data.data.tokens;
        storage.setItem('apild_access_token', tokens.accessToken);
        storage.setItem('apild_refresh_token', tokens.refreshToken);
        return tokens.accessToken;
      })
      .finally(() => { refreshing = null; });
    try {
      request.headers.Authorization = `Bearer ${await refreshing}`;
      return api(request);
    } catch (refreshError) {
      storage.removeItem('apild_access_token');
      storage.removeItem('apild_refresh_token');
      storage.removeItem('apild_user');
      window.dispatchEvent(new Event('apild:session-expired'));
      return Promise.reject(refreshError);
    }
  }
);

export const unwrap = (request) => request.then((response) => response.data.data);
export const getApiMessage = (error, fallback = 'Une erreur est survenue') => {
  if (error.code === 'ECONNABORTED') return 'Le serveur met du temps à démarrer. Veuillez réessayer dans quelques instants.';
  return error.response?.data?.error?.message || error.response?.data?.message || fallback;
};
