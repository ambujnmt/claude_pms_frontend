import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from './UI';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, FolderKanban, Milestone, BarChart2, Tag, Server, Layers, Wrench, DollarSign, UserCog, ChevronLeft, ChevronRight, ChevronDown, Code2, LifeBuoy, Globe, Smartphone, Settings, CalendarRange } from 'lucide-react';

// managerOnly: hidden from execution roles (developer, designer, ...)
// clientsOnly: only roles that may view the client directory
// children:    renders a collapsible submenu
// superAdminOnly: only the Super Admin sees it
const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { to: '/clients',     icon: Users,           label: 'Clients', clientsOnly: true },
  { key: 'projects',    icon: FolderKanban,    label: 'Projects', children: [
      { to: '/projects?type=web',    icon: Globe,      label: 'Web',     match: (p, q) => p.startsWith('/projects') && q.get('type') === 'web' },
      { to: '/projects?type=mobile', icon: Smartphone, label: 'Mobile',  match: (p, q) => p.startsWith('/projects') && q.get('type') === 'mobile' },
      { to: '/maintenance',          icon: Wrench,     label: 'Digital', match: (p) => p.startsWith('/maintenance') },
  ]},
  { to: '/milestones',  icon: Milestone,       label: 'Milestones', managerOnly: true },   // hidden from resources (developers, designers...) for now
  { to: '/tickets',     icon: LifeBuoy,        label: 'Tickets' },
  { to: '/team',        icon: UserCog,         label: 'Team', managerOnly: true },
  { to: '/resources',   icon: BarChart2,       label: 'Workload', managerOnly: true },
  { to: '/hosting',     icon: Server,          label: 'Hosting', managerOnly: true },
  { to: '/domains',     icon: Globe,           label: 'Domain', managerOnly: true },
  { to: '/services',    icon: Layers,          label: 'Services', managerOnly: true },
  { to: '/currencies',  icon: DollarSign,      label: 'Currencies', managerOnly: true },
  { to: '/categories',  icon: Tag,             label: 'Categories', managerOnly: true },
  { key: 'settings',    icon: Settings,        label: 'Settings', superAdminOnly: true, home: '/settings/billing-cycle', children: [
      { to: '/settings/billing-cycle',  icon: CalendarRange, label: 'Billing Cycle',  match: (p) => p.startsWith('/settings/billing-cycle') },
  ]},
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user, canManage, canViewClients, activeCurrency } = useApp();
  const loc = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState({ projects: true, settings: false });
  const toggleGroup = (k) => setOpenGroups(o => ({ ...o, [k]: !o[k] }));

  const NAV_BG     = '#1B2E6B';
  const NAV_HOVER  = '#253d8a';
  const NAV_ACTIVE = '#2E6DB4';
  const TEXT_INACTIVE = 'rgba(255,255,255,0.82)';
  const TEXT_ACTIVE   = '#ffffff';

  return (
    <aside style={{ width:sidebarOpen?240:64, minWidth:sidebarOpen?240:64, background:NAV_BG, display:'flex', flexDirection:'column', transition:'all 0.22s ease', position:'relative', zIndex:10 }}>

      {/* Logo */}
      <div style={{ padding:sidebarOpen?'22px 18px 18px':'22px 0 18px', display:'flex', alignItems:'center', gap:12, justifyContent:sidebarOpen?'flex-start':'center', borderBottom:'1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ width:36, height:36, borderRadius:8, flexShrink:0, background:'#4A90D9', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:'#fff', fontSize:18, fontWeight:800, fontFamily:'var(--font-body)', lineHeight:1 }}>N</span>
        </div>
        {sidebarOpen && (
          <div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.2px', lineHeight:1.2 }}>Nexus PM</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.50)', marginTop:3 }}>Project Intelligence</div>
          </div>
        )}
      </div>

      {/* Currency indicator */}
      {sidebarOpen && canManage && (
        <div style={{ margin:'10px 12px 0', padding:'5px 10px', borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:15, fontWeight:700, color:'#A8CEEC' }}>{activeCurrency.symbol}</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{activeCurrency.code} — {activeCurrency.name}</span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:3, overflowY:'auto' }}>
        {NAV.filter(n => (canManage || !n.managerOnly) && (canViewClients || !n.clientsOnly) && (user?.role === 'super_admin' || !n.superAdminOnly)).map((item) => {
          const { icon:Icon, label } = item;

          /* ── Submenu parent (Projects) ── */
          if (item.children) {
            const inProjects = item.key === 'projects'
              ? (loc.pathname.startsWith('/projects') || loc.pathname.startsWith('/maintenance'))
              : item.children.some(c => c.match(loc.pathname, new URLSearchParams(loc.search)));
            const open = sidebarOpen && (openGroups[item.key] || inProjects);
            return (
              <div key={item.key}>
                <div
                  onClick={() => sidebarOpen ? toggleGroup(item.key) : null}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:sidebarOpen?'10px 14px':'10px 0', justifyContent:sidebarOpen?'flex-start':'center', borderRadius:8, background:(!open && inProjects)?NAV_ACTIVE:'transparent', color:inProjects?TEXT_ACTIVE:TEXT_INACTIVE, fontWeight:inProjects?600:500, fontSize:14, cursor:'pointer', transition:'all 0.14s' }}
                  onMouseEnter={e => { if (!(!open && inProjects)) { e.currentTarget.style.background=NAV_HOVER; e.currentTarget.style.color='#fff'; }}}
                  onMouseLeave={e => { e.currentTarget.style.background=(!open && inProjects)?NAV_ACTIVE:'transparent'; e.currentTarget.style.color=inProjects?TEXT_ACTIVE:TEXT_INACTIVE; }}
                >
                  {sidebarOpen
                    ? <Icon size={18} strokeWidth={inProjects?2.2:1.8} style={{ flexShrink:0 }}/>
                    : <NavLink to={item.home || '/projects'} style={{ display:'flex', color:'inherit' }}><Icon size={18} strokeWidth={inProjects?2.2:1.8}/></NavLink>}
                  {sidebarOpen && <span style={{ flex:1 }}>{label}</span>}
                  {sidebarOpen && <ChevronDown size={15} style={{ transform:open?'rotate(0deg)':'rotate(-90deg)', transition:'transform 0.15s', opacity:0.8 }}/>}
                </div>
                {open && (
                  <div style={{ marginLeft:20, paddingLeft:8, borderLeft:'1px solid rgba(255,255,255,0.18)', marginTop:3, display:'flex', flexDirection:'column', gap:2 }}>
                    {item.children.map(({ to, icon:CIcon, label:cLabel, match }) => {
                      const active = match(loc.pathname, new URLSearchParams(loc.search));
                      return (
                        <NavLink key={to} to={to} style={{ textDecoration:'none' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:7, background:active?NAV_ACTIVE:'transparent', color:active?TEXT_ACTIVE:TEXT_INACTIVE, fontWeight:active?600:500, fontSize:13.5, transition:'all 0.14s' }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.background=NAV_HOVER; e.currentTarget.style.color='#fff'; }}}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=TEXT_INACTIVE; }}}
                          >
                            <CIcon size={15} strokeWidth={active?2.2:1.8} style={{ flexShrink:0 }}/>
                            {cLabel}
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          /* ── Normal item ── */
          const { to, exact } = item;
          const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:sidebarOpen?'10px 14px':'10px 0', justifyContent:sidebarOpen?'flex-start':'center', borderRadius:8, background:active?NAV_ACTIVE:'transparent', color:active?TEXT_ACTIVE:TEXT_INACTIVE, fontWeight:active?600:500, fontSize:14, transition:'all 0.14s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background=NAV_HOVER; e.currentTarget.style.color='#fff'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=TEXT_INACTIVE; }}}
              >
                <Icon size={18} strokeWidth={active?2.2:1.8} style={{ flexShrink:0 }}/>
                {sidebarOpen && label}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* User - click to open profile settings */}
      <div onClick={() => navigate('/profile')} title="Profile settings" style={{ padding:sidebarOpen?'14px 16px':'14px 0', borderTop:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:sidebarOpen?'flex-start':'center', gap:10, cursor:'pointer' }}>
        <Avatar user={user} size={34} bg="#4A90D9" fontSize={12}/>
        {sidebarOpen && (
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:14, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:2, textTransform:'capitalize' }}>{(user?.role||'').replace(/_/g,' ')}</div>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position:'absolute', right:-12, top:'50%', transform:'translateY(-50%)', width:24, height:24, borderRadius:'50%', background:'#2E6DB4', border:'2px solid #1B2E6B', boxShadow:'0 2px 8px rgba(27,46,107,0.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer', zIndex:20 }}>
        {sidebarOpen ? <ChevronLeft size={12}/> : <ChevronRight size={12}/>}
      </button>
    </aside>
  );
}
