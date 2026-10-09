import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import { getToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

/* High-level roles: full add / edit / manage rights and full financial visibility.
   Every other role is an "execution" role (developer, designer, QA, ...): they only
   see projects / contracts assigned to them and never see money.
   Keep this list in sync with App\Http\Middleware\EnforceRoleAccess::FULL_ACCESS_ROLES. */
export const FULL_ACCESS_ROLES = ['super_admin', 'management', 'pm', 'team_lead', 'account_manager', 'bd'];

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
  const canManage    = !!user && FULL_ACCESS_ROLES.includes(user.role);
  const canViewFinance = canManage;
  const isExecution  = !!user && !canManage;

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, logout,
      isSuperAdmin, isManagement, isPM, isBD,
      canManage, canViewFinance, isExecution,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
