import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, ProgressBar, Badge, formatDate } from '../components/UI';
import { resources, getTechDistribution, getTechProjection } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Users, TrendingUp, TrendingDown, AlertOctagon } from 'lucide-react';

const TECH_COLORS = ['#1B4F72','#5B3FA6','#B05A12','#1A6B3C','#92520A','#A01C1C','#0D6E6E'];

export default function ResourcesPage() { const { projects } = useApp();
  const navigate = useNavigate();
  const techDist   = getTechDistribution(projects);
  const projection = getTechProjection(projects);
  const sorted     = [...resources].sort((a, b) => b.utilization - a.utilization);
  const utilColor  = u => u > 85 ? 'var(--danger)' : u > 70 ? 'var(--warning)' : 'var(--success)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="fade-in">
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { icon: <Users size={18}/>, label: 'Total Resources', val: resources.length, color: 'var(--accent)' }, { icon: <Zap size={18}/>, label: 'Over-allocated (>85%)',val: resources.filter(r=>r.utilization>85).length, color: 'var(--danger)' }, { icon: <Users size={18}/>, label: 'Available Capacity', val: resources.filter(r=>r.utilization<70).length, color: 'var(--success)' }, ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Resource list */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700 }}>Resource Allocation</div>
          {sorted.map((r, i) => { const color = utilColor(r.utilization);
            const rProjects = r.projects.map(pid => projects.find(p => p.id === pid)).filter(Boolean);
            return (
              <div key={r.id} style={{ padding: '14px 20px', borderBottom: i < sorted.length-1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color, flexShrink: 0 }}>{r.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 1 }}>{r.tech}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{r.utilization}%</div>
                  </div>
                  <ProgressBar value={r.utilization} color={color} height={4} bg="var(--bg-elevated)" />
                  <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                    {rProjects.map(p => p && (
                      <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ padding: '2px 8px', borderRadius: 5, border: `1px solid ${p.color}30`, background: `${p.color}10`, color: p.color, fontSize: 14, cursor: 'pointer', fontWeight: 700 }}>
                        {p.name.split(' ').slice(0,2).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tech load chart */}
          <Card>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Technology Load</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>Active project demand by stack</div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={techDist.slice(0,7)} layout="vertical" barSize={11}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize:14 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 14, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={88} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {techDist.slice(0,7).map((_, i) => <Cell key={i} fill={TECH_COLORS[i % TECH_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Capacity insight */}
          <Card>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Quick Insight</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--text-dim)' }}>
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--danger-dim)', border: '1px solid #A01C1C18' }}>
                <strong style={{ color: 'var(--danger)' }}>React Native</strong> is over-allocated — new mobile projects may face resource constraints.
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--warning-dim)', border: '1px solid #92520A18' }}>
                <strong style={{ color: 'var(--warning)' }}>Python / ML</strong> moderate load. 2 AI projects nearing delivery will free capacity soon.
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--success-dim)', border: '1px solid #1A6B3C18' }}>
                <strong style={{ color: 'var(--success)' }}>Vue / Django</strong> has room — good window for new website projects.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tech Projection */}
      <TechProjection projection={projection} />
    </div>
  );
}

function TechProjection({ projection }) { const { freeing, inDemand } = projection;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <TrendingUp size={16} color="var(--accent)" />
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700 }}>Technology Projection — Next 2–3 Months</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Freeing up */}
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={14} color="var(--success)" /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>Resources Freeing Up</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Projects &gt;70% done, ending within 3 months</div>
            </div>
          </div>
          {freeing.length === 0 && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No resources freeing up in this window.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {freeing.map((f, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--success-dim)', border: '1px solid #1A6B3C20' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{f.resource.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', }}>~{f.freeingInMonths}mo</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>{f.techStack}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {f.projects.map(p => (
                    <span key={p.id} style={{ fontSize: 14, color: 'var(--text-dim)', background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      {p.name.split(' ').slice(0,2).join(' ')} — {p.completion}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* In demand */}
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertOctagon size={14} color="var(--danger)" /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>Continued High Demand</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Stacks needed for projects &lt;50% done</div>
            </div>
          </div>
          {inDemand.length === 0 && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No long-running demand detected.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {inDemand.map((d, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--danger-dim)', border: '1px solid #A01C1C18' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>{d.tech}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', }}>~{d.monthsNeeded}mo ahead</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>Needed for {d.projects.length} project{d.projects.length > 1 ? 's' : ''}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {d.projects.map(p => (
                    <span key={p.id} style={{ fontSize: 14, padding: '2px 7px', borderRadius: 8, border: `1px solid ${p.color}30`, background: `${p.color}10`, color: p.color }}>
                      {p.name.split(' ').slice(0,2).join(' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'var(--warning-dim)', border: '1px solid #92520A18', fontSize: 14, color: 'var(--warning)', lineHeight: 1.7 }}>
            <strong>Hiring Signal:</strong> Consider onboarding or upskilling for high-demand stacks before new projects begin.
          </div>
        </Card>
      </div>
    </div>
  );
}
