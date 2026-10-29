import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getData } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => { try { const result = getData(await api.get('/auth/me')); setUser(result.user); return result.user; } catch { setUser(null); return null; } finally { setLoading(false); } }, []);
  useEffect(() => { refreshUser(); }, [refreshUser]);
  const login = async (credentials) => { const result = getData(await api.post('/auth/login', credentials)); setUser(result.user); return result.user; };
  const register = async (details) => { const result = getData(await api.post('/auth/register', details)); setUser(result.user); return result.user; };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setUser(null); } };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
