import { api, unwrap } from './axios';
export const usersApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  create: (data) => unwrap(api.post('/users', data)),
  update: (id, data) => unwrap(api.patch(`/users/${id}`, data)),
  remove: (id) => api.delete(`/users/${id}`)
};
