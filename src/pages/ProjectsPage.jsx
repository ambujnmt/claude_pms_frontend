import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, ProgressBar, Badge, formatCurrency, formatDate, Btn, ConfirmModal, PageHeader } from '../components/UI';
import { Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import { resources, users } from '../data/mockData';
import AddProjectModal from '../components/AddProjectModal';

export default function ProjectsPage() { const { projects, isBD, isManagement, deleteProject, setShowAddProject, showAddProject, clients } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [confirmDel, setConfirmDel] = useState(null);

  const getClient = (p) => clients.find(c => c.id === p.clientId);

  const filtered = projects.filter(p => { const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const mStatus = filterStatus === 'all' || p.status === filterStatus;
    const mCat = filterCat === 'all' || p.category === filterCat;
    return ms && mStatus && mCat;
  });

  const catColor = { Website: 'var(--accent)', 'Mobile App': 'var(--violet)', 'AI/ML': 'var(--orange)' };

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        sub={`${projects.length} projects across all clients`}
        action={(isBD || isManagement) && <Btn icon={<Plus size={14} />} onClick={() => setShowAddProject(true)}>New Project</Btn>}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', height: 36, boxShadow: 'var(--shadow-sm)' }}>
          <Search size={13} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or clients…" style={{ background: 'none', border: 'none', outline: 'none', fontSize: 14, flex: 1, fontFamily: 'var(--font-body)' }} />
        </div>
        <FilterRow options={['all','active','completed','on-hold']} value={filterStatus} onChange={setFilterStatus} />
        <FilterRow options={['all','Website','Mobile App','AI/ML']} value={filterCat} onChange={setFilterCat} />
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{filtered.length} of {projects.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
        {filtered.map(p => { const client = getClient(p);
          return (
            <Card key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 32, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 1 }}>
                      {client ? <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={e => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}>{p.client}</span> : p.client}
                    </div>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <Badge label={p.category} color={catColor[p.category] || '#2E6DB4'} />
                <Badge label={formatCurrency(p.budget)} color="var(--text-muted)" bg="var(--bg-elevated)" />
              </div>

              {p.clientCommitment && (
                <div style={{ padding: '6px 9px', borderRadius: 6, background: 'var(--warning-dim)', border: '1px solid #92520A20', marginBottom: 10, fontSize: 14, color: 'var(--warning)', lineHeight: 1.5 }}>
                  <strong>Commitment:</strong> {p.clientCommitment.slice(0, 80)}{p.clientCommitment.length > 80 ? '…' : ''}
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Completion</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: p.color, }}>{p.completion}%</span>
                </div>
                <ProgressBar value={p.completion} color={p.color} height={4} bg="var(--bg-elevated)" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: 'var(--text-muted)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={10} /> {formatDate(p.endDate)}
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {p.resources.map(rid => { const r = resources.find(x => x.id === rid);
                    return r ? <div key={rid} title={r.name} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{r.avatar}</div> : null;
                  })}
                </div>
                {p.blockers.filter(b => !b.resolved).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--danger)', fontWeight: 700 }}>
                    <AlertCircle size={10} /> {p.blockers.filter(b => !b.resolved).length}
                  </div>
                )}
              </div>

              {isManagement && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setConfirmDel(p.id)} style={{ padding: '3px 10px', fontSize: 14, borderRadius: 6, border: '1px solid #A01C1C30', background: '#A01C1C08', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showAddProject && <AddProjectModal />}

      {confirmDel && (
        <ConfirmModal message="Delete this project? All milestones and payments will be lost." onConfirm={() => { deleteProject(confirmDel); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  );
}

function FilterRow({ options, value, onChange }) { return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, boxShadow: 'var(--shadow-sm)' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: value === o ? 'var(--accent)' : 'transparent', color: value === o ? '#fff' : 'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontWeight: value === o ? 700 : 400, textTransform: 'capitalize' }}>{o === 'all' ? 'All' : o}</button>
      ))}
    </div>
  );
}
