import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import { getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);  // true while validating stored token
  const [error, setError]     = useState(null);

  /* On mount — if a token exists, validate it and restore the session */
  useEffect(() => {
    const restore = async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const me = await authService.me();
        setUser(me);
      } catch {
        // Token invalid/expired — will redirect to login via interceptor
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
    await authService.logout();
    setUser(null);
  };

  /* Convenience flags matching the rest of the app */
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
