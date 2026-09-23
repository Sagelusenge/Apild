const apiBaseUrl = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const apiOrigin = apiBaseUrl.replace(/\/?api\/?$/, '');

export function resolveAvatarUrl(value) {
  if (!value) return '';
  const url = String(value).trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/')) return `${apiOrigin}${url}`;
  if (url.startsWith('/api/auth/avatars/')) return `${apiOrigin}${url}`;
  if (url.startsWith('uploads/')) return `${apiOrigin}/${url}`;
  return url;
}
