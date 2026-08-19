import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import { getToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  /* On mount — validate stored token */
  useEffect(() => {
    const restore = async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const me = await authService.me();
        setUser(me);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const me = await authService.login(email, password);
      setUser(me);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      return false;
    }
  };

  /* ── Signout — clears token, resets state, redirects to /login ── */
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // even if API call fails, clear local session
    } finally {
      clearToken();
      setUser(null);
      window.location.href = '/#/login';   // hard redirect — clears all app state
    }
  };

  const isManagement = user?.role === 'management';
  const isPM         = user?.role === 'pm'  || user?.role === 'management';
  const isBD         = user?.role === 'bd'  || user?.role === 'management';

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, logout,
      isManagement, isPM, isBD,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
