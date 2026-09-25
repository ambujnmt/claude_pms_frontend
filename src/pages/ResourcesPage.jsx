import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, ProgressBar, Badge, formatDate, PageHeader, EmptyState } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, AlertOctagon, Calendar, Briefcase } from 'lucide-react';

export default function ResourcesPage() {
  const { projects, categories, fmt, dataLoading } = useApp();
  const navigate = useNavigate();

  /* ── Active projects only feed the workload/distribution views ── */
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);

  /* ── Team workload — grouped by PM owner ─────────────────────── */
  const teamWorkload = useMemo(() => {
    const map = {};
    activeProjects.forEach(p => {
      const key = p.pmOwnerName || 'Unassigned';
      if (!map[key]) map[key] = { name: key, projects: [], totalBudget: 0, totalCompletion: 0 };
      map[key].projects.push(p);
      map[key].totalBudget += p.budget || 0;
      map[key].totalCompletion += p.completion || 0;
    });
    return Object.values(map)
      .map(r => ({ ...r, avgCompletion: r.projects.length ? Math.round(r.totalCompletion / r.projects.length) : 0 }))
      .sort((a, b) => b.projects.length - a.projects.length);
  }, [activeProjects]);

  /* ── BD workload — grouped by BD owner ───────────────────────── */
  const bdWorkload = useMemo(() => {
    const map = {};
    activeProjects.forEach(p => {
      const key = p.bdOwnerName || 'Unassigned';
      if (!map[key]) map[key] = { name: key, projects: [], totalBudget: 0 };
      map[key].projects.push(p);
      map[key].totalBudget += p.budget || 0;
    });
    return Object.values(map).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [activeProjects]);

  /* ── Category distribution ───────────────────────────────────── */
  const categoryDistribution = useMemo(() => {
    return categories.map(c => ({
      name:  c.name,
      value: activeProjects.filter(p => p.category === c.name).length,
      color: c.color,
    })).filter(c => c.value > 0);
  }, [categories, activeProjects]);

  /* ── Upcoming deadlines (next 30 days, active only) ──────────── */
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return activeProjects
      .filter(p => p.endDate)
      .map(p => ({ ...p, daysLeft: Math.ceil((new Date(p.endDate) - now) / (1000*60*60*24)) }))
      .filter(p => p.daysLeft >= 0 && p.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [activeProjects]);

  /* ── Overdue active projects ──────────────────────────────────── */
  const overdueProjects = useMemo(() => {
    const now = new Date();
    return activeProjects.filter(p => p.endDate && new Date(p.endDate) < now);
  }, [activeProjects]);

  /* ── Top-level stats ──────────────────────────────────────────── */
  const uniqueTeamMembers = new Set([
    ...activeProjects.map(p => p.pmOwnerName).filter(Boolean),
    ...activeProjects.map(p => p.bdOwnerName).filter(Boolean),
  ]).size;

  const totalManagedBudget = activeProjects.reduce((s, p) => s + (p.budget || 0), 0);
  const avgCompletion = activeProjects.length
    ? Math.round(activeProjects.reduce((s, p) => s + (p.completion || 0), 0) / activeProjects.length)
    : 0;

  if (dataLoading) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height:90, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.5 }}/>)}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader title="Resources" sub="Team workload and delivery capacity across active projects" />

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Active Projects',   value:activeProjects.length,        icon:<Briefcase size={16}/>,    color:'#1B2E6B', bg:'#EEF2FA' },
          { label:'Team Members Busy', value:uniqueTeamMembers,            icon:<Users size={16}/>,        color:'#2E6DB4', bg:'#EDF4FB' },
          { label:'Avg Completion',    value:`${avgCompletion}%`,          icon:<TrendingUp size={16}/>,   color:'var(--success)', bg:'#EDF7F2' },
          { label:'Overdue',           value:overdueProjects.length,       icon:<AlertOctagon size={16}/>, color:overdueProjects.length?'var(--danger)':'var(--text-muted)', bg:overdueProjects.length?'#FEF2F2':'var(--bg-elevated)' },
        ].map(k => (
          <Card key={k.label} style={{ display:'flex', alignItems:'center', gap:12, padding:14, borderTop:`3px solid ${k.color}` }}>
            <div style={{ width:34, height:34, borderRadius:9, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', color:k.color, flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{k.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16, marginBottom:20 }}>

        {/* ── PM Workload ─────────────────────────────────────────── */}
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:'#1B2E6B', marginBottom:14 }}>Project Manager Workload</div>
          {teamWorkload.length === 0
            ? <EmptyState icon="👤" message="No active projects assigned yet."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {teamWorkload.map(t => (
                  <div key={t.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'#2E6DB4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                          {t.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span style={{ fontSize:14, fontWeight:600 }}>{t.name}</span>
                      </div>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <Badge label={`${t.projects.length} project${t.projects.length!==1?'s':''}`} color="#2E6DB4"/>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--success)' }}>{fmt(t.totalBudget)}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:36 }}>
                      <ProgressBar value={t.avgCompletion} color="#2E6DB4" height={5}/>
                      <span style={{ fontSize:12, fontWeight:700, color:'#2E6DB4', minWidth:32 }}>{t.avgCompletion}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        {/* ── Category Distribution Chart ─────────────────────────── */}
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:'#1B2E6B', marginBottom:14 }}>Active Projects by Category</div>
          {categoryDistribution.length === 0
            ? <EmptyState icon="📊" message="No active projects to chart."/>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text)' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip formatter={(v) => [`${v} project${v!==1?'s':''}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                    {categoryDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* ── BD Workload ──────────────────────────────────────────── */}
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:'#1B2E6B', marginBottom:14 }}>Business Development Pipeline</div>
          {bdWorkload.length === 0
            ? <EmptyState icon="💼" message="No active projects with a BD owner."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {bdWorkload.map(b => (
                  <div key={b.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:8, background:'var(--bg-elevated)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:'#4C3A9E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>
                        {b.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize:14, fontWeight:600 }}>{b.name}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <Badge label={`${b.projects.length} deal${b.projects.length!==1?'s':''}`} color="#4C3A9E"/>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--success)' }}>{fmt(b.totalBudget)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        {/* ── Upcoming Deadlines ───────────────────────────────────── */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1B2E6B' }}>Upcoming Deadlines</div>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Next 30 days</span>
          </div>
          {upcomingDeadlines.length === 0
            ? <EmptyState icon="📅" message="No deadlines in the next 30 days."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {upcomingDeadlines.map(p => (
                  <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:'var(--bg-elevated)', cursor:'pointer' }}>
                    <div style={{ width:3, height:28, borderRadius:3, background:p.color||'#2E6DB4', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3, marginTop:2 }}><Calendar size={9}/>{formatDate(p.endDate)}</div>
                    </div>
                    <Badge label={p.daysLeft===0?'Today':`${p.daysLeft}d`} color={p.daysLeft<=7?'var(--danger)':p.daysLeft<=14?'var(--warning)':'var(--text-muted)'}/>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {/* Overdue warning banner */}
      {overdueProjects.length > 0 && (
        <Card style={{ marginTop:16, background:'var(--danger-dim)', border:'1px solid #9B1C1C30', padding:'14px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <AlertOctagon size={16} color="var(--danger)"/>
            <span style={{ fontWeight:700, color:'var(--danger)' }}>{overdueProjects.length} overdue project{overdueProjects.length!==1?'s':''}</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {overdueProjects.map(p => (
              <span key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ fontSize:12, padding:'4px 10px', borderRadius:6, background:'#fff', border:'1px solid #9B1C1C30', color:'var(--danger)', fontWeight:600, cursor:'pointer' }}>
                {p.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
