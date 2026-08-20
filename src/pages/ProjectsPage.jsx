import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, ProgressBar, Badge, formatCurrency, formatDate, Btn, ConfirmModal, PageHeader, EmptyState } from '../components/UI';
import { Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import AddProjectModal from '../components/AddProjectModal';
import projectService from '../services/projectService';

export default function ProjectsPage() {
  const { projects, setProjects, isBD, isManagement, showAddProject, setShowAddProject, clients } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [confirmDel, setConfirmDel] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState(null);

  /* ── Load projects on mount ─────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await projectService.getAll();
        setProjects(data);
      } catch {
        setApiError('Failed to load projects. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = projects.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) ||
               (p.client || '').toLowerCase().includes(search.toLowerCase());
    const mStatus = filterStatus === 'all' || p.status === filterStatus;
    const mCat    = filterCat    === 'all' || p.category === filterCat;
    return ms && mStatus && mCat;
  });

  const handleDelete = async (id) => {
    try {
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete project.');
    }
    setConfirmDel(null);
  };

  const catColor = { Website: '#2E6DB4', 'Mobile App': '#4C3A9E', 'AI/ML': '#A85010' };

  if (loading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:14 }}>
      {[1,2,3,4,5,6].map(i => <div key={i} style={{ height:200, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)' }}/>)}
    </div>
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        sub={`${projects.length} projects across all clients`}
        action={(isBD || isManagement) && <Btn icon={<Plus size={14}/>} onClick={() => setShowAddProject(true)}>New Project</Btn>}
      />

      {apiError && <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14, marginBottom:16 }}>{apiError}</div>}

      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36 }}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or clients…"
            style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}/>
        </div>
        <FilterRow options={['all','active','completed','on-hold']} value={filterStatus} onChange={setFilter}/>
        <FilterRow options={['all','Website','Mobile App','AI/ML']} value={filterCat} onChange={setFilterCat}/>
        <span style={{ fontSize:14, color:'var(--text-muted)' }}>{filtered.length} of {projects.length}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:14 }}>
        {filtered.map(p => {
          const client = clients.find(c => c.id === p.clientId || c.id === String(p.clientId));
          return (
            <Card key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:3, height:32, borderRadius:3, background:p.color, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, lineHeight:1.3 }}>{p.name}</div>
                    <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:1 }}>
                      {client
                        ? <span style={{ color:'#2E6DB4', cursor:'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}>{p.client}</span>
                        : p.client}
                    </div>
                  </div>
                </div>
                <StatusBadge status={p.status}/>
              </div>

              <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                <Badge label={p.category} color={catColor[p.category]||'#2E6DB4'}/>
                <Badge label={formatCurrency(p.budget)} color="var(--text-muted)" bg="var(--bg-elevated)"/>
              </div>

              {p.clientCommitment && (
                <div style={{ padding:'6px 9px', borderRadius:6, background:'var(--warning-dim)', border:'1px solid #8B5E0A20', marginBottom:10, fontSize:14, color:'var(--warning)', lineHeight:1.5 }}>
                  <strong>Commitment:</strong> {p.clientCommitment.slice(0,80)}{p.clientCommitment.length>80?'…':''}
                </div>
              )}

              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:14, color:'var(--text-muted)' }}>Completion</span>
                  <span style={{ fontSize:14, fontWeight:700, color:p.color }}>{p.completion}%</span>
                </div>
                <ProgressBar value={p.completion} color={p.color} height={4} bg="var(--bg-elevated)"/>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, color:'var(--text-muted)', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Calendar size={11}/> {formatDate(p.endDate)}
                </div>
                {(p.blockers||[]).filter(b=>!b.resolved).length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, color:'var(--danger)', fontWeight:700 }}>
                    <AlertCircle size={11}/> {p.blockers.filter(b=>!b.resolved).length} blocker
                  </div>
                )}
              </div>

              {isManagement && (
                <div style={{ marginTop:10, display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setConfirmDel(p.id)} style={{ padding:'4px 10px', fontSize:12, borderRadius:6, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontWeight:700, cursor:'pointer' }}>Delete</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && <EmptyState message="No projects found."/>}
      {showAddProject && <AddProjectModal />}
      {confirmDel && <ConfirmModal message="Delete this project? All milestones and payments will be lost." onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}

function FilterRow({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:3 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background: value===o?'#2E6DB4':'transparent', color: value===o?'#fff':'var(--text-muted)', fontSize:14, cursor:'pointer', fontWeight: value===o?700:400, textTransform:'capitalize' }}>{o==='all'?'All':o}</button>
      ))}
    </div>
  );
}
