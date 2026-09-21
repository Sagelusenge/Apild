import { api, unwrap } from './axios';
export const statisticsApi = {
  overview: () => unwrap(api.get('/statistics/overview')),
  projects: () => unwrap(api.get('/statistics/projects')),
  communication: () => unwrap(api.get('/statistics/communication')),
  communicationDashboard: () => unwrap(api.get('/statistics/communication-dashboard'))
};
