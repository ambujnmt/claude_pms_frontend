import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';

const TITLES = {
  '/':             'Dashboard',
  '/clients':      'Clients',
  '/projects':     'Projects',
  '/milestones':   'Milestones',
  '/resources':    'Resources',
  '/hosting':      'Hosting',
  '/services':     'Services',
  '/categories':   'Categories',
  '/maintenance':  'Maintenance',
};

export default function Topbar() {
  const { user, logout, projects } = useApp();
  const loc    = useLocation();
  const title  = TITLES[loc.pathname]
    || (loc.pathname.startsWith('/clients/') ? 'Client Detail' : 'Project Detail');
  const today  = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const urgent = projects.filter(p => p.blockers.some(b => !b.resolved)).length;

  return (
    <header style={{
      height: 54, background: '#fff',
      borderBottom: '1px solid var(--border)',
      borderTop: '3px solid #2E6DB4',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#1B2E6B', letterSpacing: '-0.5px', lineHeight: 1 }}>{title}</h1>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{today}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Role badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2E6DB4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{user.avatar}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
        )}

        {/* Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={16} color="var(--text-muted)" />
          {urgent > 0 && (
            <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: 'var(--danger)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{urgent}</div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.14s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = '#9B1C1C30'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </header>
  );
}
