import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, ProgressBar, Badge, formatDate, PageHeader } from '../components/UI';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle, Trophy, TrendingUp, CalendarCheck,
  FolderKanban, CheckCircle2, Wallet, Users,
} from 'lucide-react';

const NAVY = '#1B2E6B';
const BLUE = '#2E6DB4';
const SKY  = '#4A90D9';

export default function Dashboard() {
  const { projects, clients, clientServices, categories, fmt, dataLoading } = useApp();
  const navigate = useNavigate();

  /* ── Core project stats ────────────────────────────────────── */
  const active    = projects.filter(p => p.status === 'active').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const onHold    = projects.filter(p => p.status === 'on-hold').length;

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);
  const avgCompletion  = activeProjects.length
    ? Math.round(activeProjects.reduce((s, p) => s + (p.completion || 0), 0) / activeProjects.length)
    : 0;

  const blockers = useMemo(() =>
    projects.flatMap(p => (p.blockers || []).filter(b => !b.resolved).map(b => ({ ...b, projectName: p.name, projectId: p.id, projectColor: p.color })))
  , [projects]);

  const achievements = useMemo(() =>
    projects.flatMap(p => (p.achievements || []).map(a => ({ ...a, projectName: p.name, projectId: p.id, projectColor: p.color })))
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, 5)
  , [projects]);

  /* ── Payment health — real, computed from every project's payments ── */
  const allPayments = useMemo(() => projects.flatMap(p => (p.payments || []).map(pay => ({ ...pay, projectName: p.name, projectId: p.id }))), [projects]);
  const received = allPayments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const now = new Date();
  const overduePayments = allPayments.filter(p => p.status !== 'received' && p.date && new Date(p.date) < now);
  const upcomingPayments = allPayments
    .filter(p => p.status !== 'received' && p.date && new Date(p.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);
  const overdueAmount  = overduePayments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount  = allPayments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);

  /* ── Client stats ──────────────────────────────────────────── */
  const activeServicesCount = clientServices.filter(cs => cs.status === 'active').length;

  /* ── Category distribution ────────────────────────────────── */
  const categoryData = useMemo(() =>
    categories.map(c => ({ name: c.name, value: projects.filter(p => p.category === c.name).length, color: c.color }))
      .filter(c => c.value > 0)
  , [categories, projects]);

  /* ── Status pie ────────────────────────────────────────────── */
  const statusData = [
    { name: 'Active',    value: active,    color: BLUE },
    { name: 'Completed', value: completed, color: 'var(--success)' },
    { name: 'On Hold',   value: onHold,    color: 'var(--warning)' },
  ].filter(s => s.value > 0);

  if (dataLoading) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height:100, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.5 }}/>)}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader sub="Overview of all projects, clients, and delivery health" />

      {/* ── KPI cards (clickable) ───────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard icon={<FolderKanban size={17}/>}  label="Active Projects" value={active}              sub={`${completed} completed`}                                              accent={NAVY} light="#EEF2FA" to="/projects"    navigate={navigate}/>
        <KpiCard icon={<TrendingUp size={17}/>}    label="Avg Completion"  value={`${avgCompletion}%`}  sub="across active projects"                                                accent={BLUE} light="#EDF4FB" to="/milestones"  navigate={navigate}/>
        <KpiCard icon={<Users size={17}/>}         label="Total Clients"   value={clients.length}       sub={`${activeServicesCount} active service${activeServicesCount!==1?'s':''}`} accent={SKY}  light="#EBF4FA" to="/clients"     navigate={navigate}/>
        <KpiCard icon={<AlertTriangle size={17}/>} label="Open Blockers"   value={blockers.length}      sub="needing attention"                                                     accent={blockers.length?'var(--danger)':BLUE} light={blockers.length?'#FEF2F2':'#EDF4FB'} to="/projects" navigate={navigate}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16, marginBottom:16 }}>

        {/* ── Payment health ──────────────────────────────────── */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:NAVY }}>Payment Health</div>
            <Wallet size={16} color="var(--text-muted)"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            <MiniStat label="Received"  value={fmt(received)}      color="var(--success)"/>
            <MiniStat label="Pending"   value={fmt(pendingAmount)} color="var(--warning)"/>
            <MiniStat label="Overdue"   value={fmt(overdueAmount)} color={overdueAmount>0?'var(--danger)':'var(--text-muted)'}/>
          </div>

          {upcomingPayments.length > 0 && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Next Payments Due</div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {upcomingPayments.map(p => (
                  <div key={p.id} onClick={() => navigate(`/projects/${p.projectId}`)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', borderRadius:7, background:'var(--bg-elevated)', cursor:'pointer', fontSize:13 }}>
                    <span style={{ color:'var(--text)' }}>{p.projectName} <span style={{ color:'var(--text-muted)' }}>· {p.type}</span></span>
                    <span style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ color:'var(--text-muted)' }}>{formatDate(p.date)}</span>
                      <strong style={{ color:BLUE }}>{fmt(p.amount)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {upcomingPayments.length === 0 && overdueAmount === 0 && (
            <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'10px 0' }}>No pending payments scheduled.</div>
          )}
        </Card>

        {/* ── Project status breakdown ────────────────────────── */}
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:14 }}>Project Status</div>
          {statusData.length === 0
            ? <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'30px 0' }}>No projects yet.</div>
            : (
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} project${v!==1?'s':''}`, '']} contentStyle={{ fontSize:12, borderRadius:8 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                  {statusData.map(s => (
                    <div key={s.name} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:9, height:9, borderRadius:2, background:s.color }}/>
                      <span style={{ fontSize:13, flex:1 }}>{s.name}</span>
                      <span style={{ fontSize:13, fontWeight:700 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* ── Recent wins ──────────────────────────────────────── */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Trophy size={16} color="#4C3A9E"/>
            <div style={{ fontSize:15, fontWeight:700, color:NAVY }}>Recent Wins</div>
          </div>
          {achievements.length === 0
            ? <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>No wins logged yet.</div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {achievements.map(a => (
                  <div key={a.id} onClick={() => navigate(`/projects/${a.projectId}`)} style={{ display:'flex', gap:10, padding:'8px 10px', borderRadius:8, background:'var(--bg-elevated)', cursor:'pointer' }}>
                    <div style={{ width:3, borderRadius:3, background:a.projectColor||'#4C3A9E', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{a.description}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{a.projectName} · {formatDate(a.addedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        {/* ── Open blockers ────────────────────────────────────── */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <AlertTriangle size={16} color="var(--danger)"/>
            <div style={{ fontSize:15, fontWeight:700, color:NAVY }}>Open Blockers</div>
          </div>
          {blockers.length === 0
            ? <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>✅ No open blockers — all clear.</div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {blockers.slice(0, 5).map(b => (
                  <div key={b.id} onClick={() => navigate(`/projects/${b.projectId}`)} style={{ display:'flex', gap:10, padding:'8px 10px', borderRadius:8, background:'var(--danger-dim)', cursor:'pointer' }}>
                    <div style={{ width:3, borderRadius:3, background:'var(--danger)', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                        <Badge label={b.type} color="var(--danger)"/>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>{formatDate(b.addedAt)}</span>
                      </div>
                      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{b.description}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{b.projectName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {/* ── Category distribution (only if categories in use) ──── */}
      {categoryData.length > 0 && (
        <Card style={{ marginTop:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:14 }}>Projects by Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
              <Tooltip formatter={(v) => [`${v} project${v!==1?'s':''}`, '']} contentStyle={{ fontSize:12, borderRadius:8 }}/>
              <Bar dataKey="value" radius={[6,6,0,0]} barSize={40}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, accent, light, to, navigate }) {
  return (
    <Card
      hover
      onClick={() => navigate(to)}
      style={{ padding:'15px 18px', borderTop:`3px solid ${accent}`, overflow:'hidden', cursor:'pointer' }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:light, display:'flex', alignItems:'center', justifyContent:'center', color:accent, flexShrink:0 }}>{icon}</div>
          <span style={{ fontSize:14, color:'var(--text-muted)', fontWeight:600 }}>{label}</span>
        </div>
        <span style={{ fontSize:14, color:accent, opacity:0.5, fontWeight:500 }}>→</span>
      </div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:32, fontWeight:700, color:accent, letterSpacing:'-0.5px', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:4 }}>{sub}</div>
    </Card>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign:'center', padding:'10px 6px', borderRadius:9, background:'var(--bg-elevated)' }}>
      <div style={{ fontSize:16, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{label}</div>
    </div>
  );
}
