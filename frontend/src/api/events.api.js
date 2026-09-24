import { api, unwrap } from './axios';
export const eventsApi = {
  list: (params) => api.get('/events', { params }).then((r) => r.data),
  calendar: (from, to) => unwrap(api.get('/events/calendar', { params: { from, to } })),
  create: (data) => unwrap(api.post('/events', data)),
  update: (id, data) => unwrap(api.patch(`/events/${id}`, data)),
  availableStaff: () => unwrap(api.get('/events/actors')),
  participants: (id) => unwrap(api.get(`/events/${id}/participants`)),
  replaceParticipants: (id, userIds) => unwrap(api.put(`/events/${id}/participants`, { user_ids: userIds })),
  remove: (id) => api.delete(`/events/${id}`)
};
