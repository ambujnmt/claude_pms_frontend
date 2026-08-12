import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, Badge, formatDate } from '../components/UI';
import { getMilestonesInCycle, currentCycle } from '../data/mockData';
import { CheckCircle2, Clock, AlertCircle, CalendarCheck, Target } from 'lucide-react';

export default function MilestonesPage() { const navigate = useNavigate();
  const { projects, toggleMilestoneCycleTarget, isPM } = useApp();
  const [view, setView] = useState('cycle');

  const cycleMilestones = getMilestonesInCycle(currentCycle.from, currentCycle.to, projects);
  const allMilestones   = projects.flatMap(p =>
    p.milestones.map(m => ({ ...m, projectId: p.id, projectName: p.name, projectColor: p.color, client: p.client }))
  ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const overdue    = allMilestones.filter(m => m.status === 'overdue');
  const inProgress = allMilestones.filter(m => m.status === 'in-progress');
  const targeted   = allMilestones.filter(m => m.cycleTargeted);
  const completedL = allMilestones.filter(m => m.status === 'completed');
  const displayed  = view === 'cycle' ? cycleMilestones : allMilestones;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="fade-in">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: <AlertCircle size={14}/>, label: 'Overdue', count: overdue.length, color: 'var(--danger)' }, { icon: <Clock size={14}/>, label: 'In Progress', count: inProgress.length, color: 'var(--violet)' }, { icon: <Target size={14}/>, label: 'Cycle Targeted',count: targeted.length, color: 'var(--orange)' }, { icon: <CheckCircle2 size={14}/>, label: 'Completed', count: completedL.length, color: 'var(--success)' }, ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toggle + info */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {[['cycle', 'Current Cycle'], ['all', 'All Milestones']].map(([k, label]) => (
            <button key={k} onClick={() => setView(k)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: view === k ? 'var(--accent)' : 'transparent', color: view === k ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: view === k ? 700 : 400, cursor: 'pointer', transition: 'all 0.13s' }}>{label}</button>
          ))}
        </div>
        {view === 'cycle' && (
          <div style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--warning-dim)', border: '1px solid #92520A25', fontSize: 14, color: 'var(--orange)', fontWeight: 700 }}>
            <CalendarCheck size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            {currentCycle.label}
          </div>
        )}
        {isPM && (
          <div style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            💡 Click <strong>Set Target</strong> to include a milestone in cycle payment tracking
          </div>
        )}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700 }}>{view === 'cycle' ? 'Milestones in Current Cycle' : 'All Milestones'}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{displayed.length} milestones</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Milestone', 'Project', 'Due Date', 'Completed', 'Status', 'Cycle Target'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No milestones found.</td></tr>
              )}
              {displayed.map((m, i) => (
                <tr key={`${m.id}-${m.projectId}`}
                  style={{ borderBottom: '1px solid var(--border)', background: m.cycleTargeted ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (!m.cycleTargeted) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = m.cycleTargeted ? 'var(--accent-dim)' : 'transparent'; }}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 18, borderRadius: 3, background: m.projectColor, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }} onClick={() => navigate(`/projects/${m.projectId}`)}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.projectName}</div>
                    {m.client && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{m.client}</div>}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 14, color: m.status === 'overdue' ? 'var(--danger)' : 'var(--text-dim)', fontWeight: m.status === 'overdue' ? 700 : 400 }}>
                    {formatDate(m.dueDate)}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 14, color: 'var(--success)' }}>
                    {m.completedDate ? formatDate(m.completedDate) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={m.status} /></td>
                  <td style={{ padding: '11px 14px' }}>
                    {m.status !== 'completed' && isPM ? (
                      <button onClick={() => toggleMilestoneCycleTarget(m.projectId, m.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, border: `1px solid ${m.cycleTargeted ? 'var(--accent)' : 'var(--border)'}`, background: m.cycleTargeted ? 'var(--bg-card)' : 'var(--bg-elevated)', color: m.cycleTargeted ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.13s' }}>
                        <Target size={10} />{m.cycleTargeted ? 'Targeted' : 'Set Target'}
                      </button>
                    ) : m.cycleTargeted
                      ? <Badge label="Targeted" color="var(--accent)" />
                      : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
