import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import { getToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // clear local session regardless of API result
    } finally {
      clearToken();
      setUser(null);
      window.location.href = '/#/login';
    }
  };

  /* super_admin carries every privilege alongside its own role */
  const isSuperAdmin = user?.role === 'super_admin';
  const isManagement = isSuperAdmin || user?.role === 'management';
  const isPM         = isSuperAdmin || isManagement || user?.role === 'pm';
  const isBD         = isSuperAdmin || isManagement || user?.role === 'bd';

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, logout,
      isSuperAdmin, isManagement, isPM, isBD,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
