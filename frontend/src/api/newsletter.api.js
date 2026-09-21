import { api, unwrap } from './axios';
export const newsletterApi = {
  subscribe: (email) => unwrap(api.post('/newsletter/subscribe', { email })),
  unsubscribe: (token) => unwrap(api.post('/newsletter/unsubscribe', { token }))
};
