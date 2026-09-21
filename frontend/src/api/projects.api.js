import { api, unwrap } from './axios';
export const projectsApi = {
  publicList: () => unwrap(api.get('/public/projects')),
  publicOne: (id) => unwrap(api.get(`/public/projects/${id}`)),
  list: (params) => api.get('/projects', { params }).then((r) => r.data),
  create: (data) => unwrap(api.post('/projects', data)),
  update: (id, data) => unwrap(api.patch(`/projects/${id}`, data)),
  remove: (id) => api.delete(`/projects/${id}`)
};
