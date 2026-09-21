import { api } from './axios';

// Analytics is intentionally fire-and-forget: a visitor never waits for a
// measurement request before navigating through the public site.
export const analyticsApi = {
  track: (payload) => api.post('/analytics/track', payload)
};
