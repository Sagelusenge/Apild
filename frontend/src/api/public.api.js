import { api, unwrap } from './axios';
export const publicApi = {
  impact: () => unwrap(api.get('/public/impact')),
  interventions: () => unwrap(api.get('/public/interventions')),
  partners: () => unwrap(api.get('/public/partners')),
  contact: (data) => unwrap(api.post('/contact', data))
};
