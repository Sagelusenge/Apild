import { api, unwrap } from './axios';

export const authApi = {
  login: (credentials) => unwrap(api.post('/auth/login', credentials)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (profile) => unwrap(api.patch('/auth/profile', profile)),
  updateAvatar: (file) => {
    const payload = new FormData();
    payload.append('avatar', file);
    return unwrap(api.post('/auth/profile/avatar', payload));
  },
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (payload, password) => unwrap(api.post('/auth/reset-password', typeof payload === 'string' ? { token: payload, password } : payload)),
  changePassword: ({ newPassword, currentPassword }) => unwrap(api.post('/auth/change-password', {
    new_password: newPassword,
    ...(currentPassword ? { current_password: currentPassword } : {})
  })),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken })
};
