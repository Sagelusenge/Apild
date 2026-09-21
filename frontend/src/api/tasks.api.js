import { api, unwrap } from './axios';
export const tasksApi = {
  list: (params) => api.get('/tasks', { params }).then((r) => r.data),
  create: (data) => unwrap(api.post('/tasks', data)),
  update: (id, data) => unwrap(api.patch(`/tasks/${id}`, data)),
  remove: (id) => api.delete(`/tasks/${id}`)
};
