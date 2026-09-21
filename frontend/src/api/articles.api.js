import { api, unwrap } from './axios';
export const articlesApi = {
  publicList: (params = { limit: 6 }) => api.get('/articles', { params }).then((r) => r.data),
  publicOne: (id) => unwrap(api.get(`/articles/${id}`)),
  list: (params) => api.get('/articles', { params }).then((r) => r.data),
  engagement: (id, visitorId) => unwrap(api.get(`/articles/${id}/engagement`, { params: { visitor_id: visitorId } })),
  comments: (id, params = {}) => api.get(`/articles/${id}/comments`, { params }).then((r) => r.data),
  createComment: (id, payload) => unwrap(api.post(`/articles/${id}/comments`, payload)),
  toggleLike: (id, visitorId) => unwrap(api.post(`/articles/${id}/like`, { visitor_id: visitorId })),
  recordShare: (id) => unwrap(api.post(`/articles/${id}/share`, {})),
  // Keeps the article and its editorial history in the platform while taking
  // it out of all public article listings.
  unpublish: (id) => unwrap(api.patch(`/articles/${id}/unpublish`))
};
