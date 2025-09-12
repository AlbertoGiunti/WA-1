import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // {id, username, coins}
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    const u = await api.login(username, password);
    setUser(u);
  };

  const register = async (username, password) => {
    const u = await api.register(username, password);
    setUser(u);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const refresh = useCallback(async (signal) => {
    try { const u = await api.me({ signal }); setUser(u); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    refresh(ctrl.signal);
    return () => ctrl.abort();
  }, [refresh]);

  const syncCoins = async () => {
    try {
      const s = await api.meSnapshot();
      setUser(u => u ? ({ ...u, coins: s.coins }) : u);
    } catch {}
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, syncCoins }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
