import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api';

export const AuthContext = createContext(null);
const storage = sessionStorage;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(storage.getItem('apild_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(storage.getItem('apild_access_token')));

  const clearSession = useCallback(() => {
    storage.removeItem('apild_access_token');
    storage.removeItem('apild_refresh_token');
    storage.removeItem('apild_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const restore = async () => {
      if (!storage.getItem('apild_access_token')) return setLoading(false);
      try {
        const profile = await authApi.me();
        storage.setItem('apild_user', JSON.stringify(profile));
        setUser(profile);
      } catch { clearSession(); }
      finally { setLoading(false); }
    };
    restore();
    window.addEventListener('apild:session-expired', clearSession);
    return () => window.removeEventListener('apild:session-expired', clearSession);
  }, [clearSession]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const nextUser = { ...data.user, must_change_password: Boolean(data.must_change_password ?? data.user?.must_change_password) };
    storage.setItem('apild_access_token', data.tokens.accessToken);
    storage.setItem('apild_refresh_token', data.tokens.refreshToken);
    storage.setItem('apild_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const changePassword = useCallback(async ({ newPassword, currentPassword }) => {
    const data = await authApi.changePassword({ newPassword, currentPassword });
    const nextUser = { ...data.user, must_change_password: false };
    storage.setItem('apild_access_token', data.tokens.accessToken);
    storage.setItem('apild_refresh_token', data.tokens.refreshToken);
    storage.setItem('apild_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateProfile = useCallback(async (profile) => {
    const nextUser = await authApi.updateProfile(profile);
    storage.setItem('apild_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateAvatar = useCallback(async (file) => {
    const nextUser = await authApi.updateAvatar(file);
    storage.setItem('apild_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    const token = storage.getItem('apild_refresh_token');
    try { if (token) await authApi.logout(token); } finally { clearSession(); }
  }, [clearSession]);

  const value = useMemo(() => ({ user, loading, login, changePassword, updateProfile, updateAvatar, logout, isAuthenticated: Boolean(user) }), [user, loading, changePassword, updateProfile, updateAvatar, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
