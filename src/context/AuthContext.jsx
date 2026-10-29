import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import profileService from '../services/profileService';
import { getToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

/* High-level roles: full add / edit / manage rights and full financial visibility.
   Every other role is an "execution" role (developer, designer, QA, ...): they only
   see projects / contracts assigned to them and never see money.
   Keep this list in sync with App\Http\Middleware\EnforceRoleAccess::FULL_ACCESS_ROLES. */
export const FULL_ACCESS_ROLES = ['super_admin', 'management', 'pm', 'team_lead', 'account_manager', 'bd'];

/* Client directory:
   - add / edit / delete  -> Super Admin, Management, BD only
   - view only            -> managers (PM, Team Lead, Account Manager)
   - everyone else (developer, designer, marketing, ...) has no client access at all.
   Keep in sync with EnforceRoleAccess::CLIENT_WRITE_ROLES / CLIENT_VIEW_ROLES. */
/* Who may see ALL tickets and assign / change status / close them. Everyone else: raise + see own.
   Keep in sync with EnforceRoleAccess::TICKET_MANAGER_ROLES. */
export const TICKET_MANAGER_ROLES = ['super_admin', 'management', 'pm', 'team_lead', 'account_manager'];
export const CLIENT_WRITE_ROLES = ['super_admin', 'management', 'bd'];
export const CLIENT_VIEW_ROLES  = ['super_admin', 'management', 'bd', 'pm', 'team_lead', 'account_manager'];

/* Who may add / edit the Resources (developers, designers, QA...) on a project.
   Keep in sync with ProjectController::RESOURCE_MANAGER_ROLES. */
export const RESOURCE_MANAGER_ROLES = ['super_admin', 'management', 'pm', 'team_lead', 'account_manager'];

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  /* /auth/me may not include the photo link on every backend build -> ask /profile for it too */
  const withPhoto = async (u) => {
    if (!u || u.avatarUrl || u.avatar_url) return u;
    try {
      const p = await profileService.get();
      return { ...u, avatar_url: p?.avatar_url ?? u.avatar_url, profile_photo_path: p?.profile_photo_path ?? u.profile_photo_path };
    } catch { return u; }
  };

  useEffect(() => {
    const restore = async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const me = await authService.me();
        setUser(await withPhoto(me));
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
      setUser(await withPhoto(me));
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
  const canAssignResources = !!user && RESOURCE_MANAGER_ROLES.includes(user.role);
  const canEditClients = !!user && CLIENT_WRITE_ROLES.includes(user.role);
  const canViewClients = !!user && CLIENT_VIEW_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, logout,
      isSuperAdmin, isManagement, isPM, isBD,
      canManage, canViewFinance, isExecution, canEditClients, canViewClients, canAssignResources,
      patchUser: (partial) => setUser(prev => prev ? { ...prev, ...partial } : prev),
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
