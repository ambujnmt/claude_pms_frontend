import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, StatusBadge, ProgressBar, Badge, formatCurrency, formatDate } from '../components/UI';
import { getMilestonesInCycle, currentCycle, getCyclePaymentSummary, resources } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertTriangle, Trophy, TrendingUp, CalendarCheck, FolderKanban, CheckCircle2, Wallet, Users } from 'lucide-react';

/* Palette pulled from the Gantt image */
const NAVY   = '#1B2E6B';
const BLUE   = '#2E6DB4';
const SKY    = '#4A90D9';
const POWDER = '#A8CEEC';
const CAT_COLORS = { Website: BLUE, 'Mobile App': '#4C3A9E', 'AI/ML': '#A85010' };

export default function Dashboard() { const { isManagement, projects, clients, clientServices } = useApp();
  const navigate = useNavigate();

  const active       = projects.filter(p => p.status === 'active').length;
  const completed    = projects.filter(p => p.status === 'completed').length;
  const blockers     = projects.flatMap(p => p.blockers.filter(b => !b.resolved));
  const achievements = projects.flatMap(p => p.achievements.map(a => ({ ...a, projectName: p.name, projectColor: p.color })));
  const cycleMilestones = getMilestonesInCycle(currentCycle.from, currentCycle.to, projects);
  const cyclePayments   = getCyclePaymentSummary(projects);
  const avgCompletion   = active > 0 ? Math.round(projects.filter(p => p.status==='active').reduce((s,p)=>s+p.completion,0)/active) : 0;
  const monthlyRevenue  = clientServices.filter(cs => cs.status==='active').reduce((s,cs)=>s+cs.monthlyAmount,0);

  const catData = ['Website','Mobile App','AI/ML'].map(cat => ({ name:cat, value:projects.filter(p=>p.category===cat).length }));
  const topResources = [...resources].sort((a,b)=>b.utilization-a.utilization).slice(0,5);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }} className="fade-in">

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard icon={<FolderKanban size={17}/>}  label="Active Projects"   value={active}              sub={`${completed} completed`}                                     accent={NAVY}  light="#EEF2FA" to="/projects" />
        <KpiCard icon={<TrendingUp size={17}/>}    label="Avg Completion"    value={`${avgCompletion}%`} sub="across active projects"                                       accent={BLUE}  light="#EDF4FB" to="/milestones" />
        <KpiCard icon={<Users size={17}/>}         label="Total Clients"     value={clients.length}      sub={`${clientServices.filter(cs=>cs.status==='active').length} services`} accent={SKY} light="#EBF4FA" to="/clients" />
        <KpiCard icon={<AlertTriangle size={17}/>} label="Open Blockers"     value={blockers.length}     sub="needing attention"                                            accent={blockers.length?'var(--danger)':BLUE} light={blockers.length?'#FEF2F2':'#EDF4FB'} to="/projects" />
      </div>

      {/* Cycle payment — management only */}
      {isManagement && <CyclePaymentPanel cp={cyclePayments} />}

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <Card style={{ gridColumn:'1 / 3', padding:'18px 20px' }}>
          <SectionHeading>Project Completion</SectionHeading>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:14 }}>Active projects progress</div>
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={projects.filter(p=>p.status==='active').map(p=>({ name:p.name.split(' ').slice(0,2).join(' '), completion:p.completion, color:p.color }))} barSize={26}>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:14, fontFamily:'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:14 }} axisLine={false} tickLine={false} domain={[0,100]} />
              <Tooltip contentStyle={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, fontSize:14, fontFamily:'Inter' }} formatter={v=>[`${v}%`,'Completion']} />
              <Bar dataKey="completion" radius={[4,4,0,0]}>
                {projects.filter(p=>p.status==='active').map((p,i)=><Cell key={i} fill={p.color} fillOpacity={0.9}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding:'18px 20px' }}>
          <SectionHeading>Categories</SectionHeading>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:12 }}>Portfolio mix</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={4} dataKey="value">
                {catData.map((c,i)=><Cell key={i} fill={CAT_COLORS[c.name]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, fontSize:14 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:6 }}>
            {catData.map((c,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'var(--text-dim)' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:CAT_COLORS[c.name] }}/>{c.name}
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:CAT_COLORS[c.name], fontFamily:'var(--font-display)' }}>{c.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Cycle milestones */}
        <Card style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <SectionHeading>Cycle Milestones</SectionHeading>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>{currentCycle.label}</div>
            </div>
            <Badge label={`${cycleMilestones.filter(m=>m.cycleTargeted).length} targeted`} color={SKY} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:200, overflowY:'auto' }}>
            {cycleMilestones.length===0 && <div style={{ color:'var(--text-muted)', fontSize:14 }}>No milestones fall in this cycle.</div>}
            {cycleMilestones.map((m,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:7, background: m.cycleTargeted ? '#EDF4FB' : 'var(--bg-elevated)', border:`1px solid ${m.cycleTargeted?'#A8CEEC':'transparent'}`, gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                  <div style={{ width:3, height:24, borderRadius:3, background:m.projectColor, flexShrink:0 }}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize:14, color:'var(--text-muted)' }}>{m.projectName}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                  {m.cycleTargeted && <span style={{ fontSize:14, background:BLUE, color:'#fff', padding:'3px 8px', borderRadius:5, fontWeight:600 }}>Target</span>}
                  <StatusBadge status={m.status}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resource utilization */}
        <Card style={{ padding:'18px 20px' }}>
          <SectionHeading>Resource Utilization</SectionHeading>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:14 }}>Top occupied team members</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {topResources.map(r=>{ const color = r.utilization>85?'var(--danger)':r.utilization>70?'var(--warning)':BLUE;
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background: r.utilization>85?'#FEF2F2':'#EDF4FB', border:`2px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color, flexShrink:0 }}>{r.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:600 }}>{r.name}</span>
                      <span style={{ fontSize:14, fontWeight:700, color }}>{r.utilization}%</span>
                    </div>
                    <ProgressBar value={r.utilization} color={color} height={5} bg="var(--bg-elevated)"/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Blockers & Wins */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <AlertTriangle size={14} color="var(--danger)"/>
            <SectionHeading>Active Blockers</SectionHeading>
            <div style={{ marginLeft:'auto' }}><Badge label={`${blockers.length} open`} color="var(--danger)"/></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {blockers.length===0 && <div style={{ color:'var(--success)', fontSize:14, display:'flex', alignItems:'center', gap:6 }}><CheckCircle2 size={13}/> No blockers — all clear!</div>}
            {blockers.map((b,i)=>{ const proj = projects.find(p=>p.blockers.some(bl=>bl.id===b.id));
              return (
                <div key={i} style={{ padding:'9px 11px', borderRadius:7, background:'#FEF2F2', border:'1px solid #9B1C1C18' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--danger)' }}>{b.type}</span>
                    <span style={{ fontSize:14, color:'var(--text-muted)' }}>{proj?.name}</span>
                  </div>
                  <div style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.5 }}>{b.description}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Trophy size={14} color={SKY}/>
            <SectionHeading>Recent Wins</SectionHeading>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {achievements.length===0 && <div style={{ color:'var(--text-muted)', fontSize:14 }}>No achievements logged yet.</div>}
            {achievements.slice(0,4).map((a,i)=>(
              <div key={i} style={{ padding:'9px 11px', borderRadius:7, background:'#EDF4FB', border:'1px solid #A8CEEC40' }}>
                <div style={{ fontSize:14, color:NAVY, fontWeight:700, marginBottom:4 }}>{a.projectName}</div>
                <div style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.5 }}>{a.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SectionHeading({ children }) { return <div style={{ fontFamily:'var(--font-body)', fontSize:16, fontWeight:700, color:'#1B2E6B', letterSpacing:'-0.2px', marginBottom:0 }}>{children}</div>;
}

function KpiCard({ icon, label, value, sub, accent, light, to }) {
  const navigate = useNavigate();
  return (
    <Card
      hover
      onClick={() => navigate(to)}
      style={{ padding:'15px 18px', borderTop:`3px solid ${accent}`, overflow:'hidden', cursor:'pointer', position:'relative' }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:7, background: light, display:'flex', alignItems:'center', justifyContent:'center', color:accent, flexShrink:0 }}>{icon}</div>
          <span style={{ fontSize:14, color:'var(--text-muted)', fontWeight:600 }}>{label}</span>
        </div>
        <span style={{ fontSize:14, color: accent, opacity: 0.5, fontWeight:500 }}>→</span>
      </div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:32, fontWeight:700, color:accent, letterSpacing:'-0.5px', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:4 }}>{sub}</div>
    </Card>
  );
}

function CyclePaymentPanel({ cp }) { const { expected, received, expectedList } = cp;
  const pct = expected > 0 ? Math.round((received/expected)*100) : 0;
  const outstanding = expected - received;

  return (
    <Card style={{ padding:0, overflow:'hidden', border:`1.5px solid #1B2E6B` }}>
      {/* Navy bar — matching Gantt header exactly */}
      <div style={{ background:'#1B2E6B', padding:'14px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Wallet size={17} color="#A8CEEC"/>
          <div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:16, fontWeight:700, color:'#fff' }}>Cycle Payment Tracker</div>
            <div style={{ fontSize:14, color:'rgba(168,206,236,0.65)', marginTop:1 }}>{currentCycle.label}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          {[
            { label:'RECEIVED', val:formatCurrency(received), color:'#A8CEEC' }, { label:'EXPECTED', val:formatCurrency(expected), color:'rgba(255,255,255,0.75)' }, { label:'OUTSTANDING', val:formatCurrency(outstanding), color: outstanding>0?'#FCD34D':'#6EE7B7' }, ].map((s,i)=>(
            <div key={i} style={{ textAlign:'right' }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:14, color:'rgba(168,206,236,0.75)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress breakdown */}
      <div style={{ padding:'14px 22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:14 }}>
          <span style={{ color:'var(--text-muted)' }}>Collection progress</span>
          <span style={{ fontWeight:800, color:'#2E6DB4', }}>{pct}%</span>
        </div>
        <div style={{ height:7, background:'var(--bg-elevated)', borderRadius:4, overflow:'hidden', marginBottom:14 }}>
          {/* Gantt-style segmented bar */}
          <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg,#2E6DB4,#4A90D9)', borderRadius:4, transition:'width 0.6s ease' }}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:120, overflowY:'auto' }}>
          {expectedList.length===0 && <div style={{ fontSize:14, color:'var(--text-muted)' }}>No milestones targeted for this cycle yet. Go to <strong>Milestones</strong> to set targets.</div>}
          {expectedList.map((pay,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:2, background: pay.status==='received'?'var(--success)':'var(--border-bright)', flexShrink:0 }}/>
                <span style={{ color:'var(--text-dim)' }}><strong style={{ color:'var(--text)' }}>{pay.projectName}</strong> — {pay.milestoneName}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <span style={{ fontWeight:700 }}>{formatCurrency(pay.amount)}</span>
                <StatusBadge status={pay.status}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
