import { api, unwrap } from './axios';
export const resourceApi = {
  list: (resource, params) => api.get(`/${resource}`, { params }).then((r) => r.data),
  one: (resource, id) => unwrap(api.get(`/${resource}/${id}`)),
  create: (resource, data) => unwrap(api.post(`/${resource}`, data)),
  update: (resource, id, data) => unwrap(api.patch(`/${resource}/${id}`, data)),
  blockUser: (id) => unwrap(api.patch(`/users/${id}/block`)),
  unblockUser: (id) => unwrap(api.patch(`/users/${id}/unblock`)),
  remove: (resource, id) => api.delete(`/${resource}/${id}`)
};
