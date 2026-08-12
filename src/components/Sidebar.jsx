import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, FolderKanban, Milestone, BarChart2, Tag, Server, Layers, Wrench, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { to: '/clients',     icon: Users,           label: 'Clients' },
  { to: '/projects',    icon: FolderKanban,    label: 'Projects' },
  { to: '/milestones',  icon: Milestone,       label: 'Milestones' },
  { to: '/maintenance', icon: Wrench,          label: 'Maintenance' },
  { to: '/resources',   icon: BarChart2,       label: 'Resources' },
  { to: '/hosting',     icon: Server,          label: 'Hosting' },
  { to: '/services',    icon: Layers,          label: 'Services' },
  { to: '/categories',  icon: Tag,             label: 'Categories' },
];

export default function Sidebar() { const { sidebarOpen, setSidebarOpen, user, isBD, setShowAddProject } = useApp();
  const loc = useLocation();

  const NAV_BG     = '#1B2E6B';
  const NAV_HOVER  = '#253d8a';
  const NAV_ACTIVE = '#2E6DB4';

  /* Inactive text: full-opacity white at 85% — clearly readable on dark navy */
  const TEXT_INACTIVE = 'rgba(255,255,255,0.82)';
  const TEXT_ACTIVE   = '#ffffff';

  return (
    <aside style={{ width: sidebarOpen ? 240 : 64, minWidth: sidebarOpen ? 240 : 64, background: NAV_BG, display: 'flex', flexDirection: 'column', transition: 'all 0.22s ease', position: 'relative', zIndex: 10, }}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{ padding: sidebarOpen ? '22px 18px 18px' : '22px 0 18px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: sidebarOpen ? 'flex-start' : 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: '#4A90D9', display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-body)', lineHeight: 1 }}>N</span>
        </div>
        {sidebarOpen && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px', lineHeight: 1.2 }}>Nexus PM</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', marginTop: 3, fontFamily: 'var(--font-body)', fontWeight: 400 }}>Project Intelligence</div>
          </div>
        )}
      </div>

      {/* ── New Project button ────────────────────────────────── */}
      {isBD && (
        <div style={{ padding: sidebarOpen ? '14px 12px 0' : '14px 8px 0' }}>
          <button
            onClick={() => setShowAddProject(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: sidebarOpen ? '9px 14px' : '9px 0', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: 8, border: '1.5px dashed rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)', }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.30)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
          >
            <Plus size={16} strokeWidth={2.5} />
            {sidebarOpen && 'New Project'}
          </button>
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, label, exact }) => { const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: sidebarOpen ? '10px 14px' : '10px 0', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: 8, background: active ? NAV_ACTIVE : 'transparent', color: active ? TEXT_ACTIVE : TEXT_INACTIVE, fontWeight: active ? 600 : 500, fontSize: 14, transition: 'all 0.14s', }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = NAV_HOVER; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_INACTIVE; } }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                {sidebarOpen && label}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User strip ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 10, }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4A90D9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', }}>{user.avatar}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2, textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ───────────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#2E6DB4', border: '2px solid #1B2E6B', boxShadow: '0 2px 8px rgba(27,46,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 20, }}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  );
}
