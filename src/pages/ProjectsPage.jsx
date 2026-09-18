import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, StatusBadge, ProgressBar, Badge, Btn, Modal, Field,
  inputStyle, ConfirmModal, PageHeader, EmptyState, formatDate,
} from '../components/UI';
import { Search, Plus, Calendar, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import AddProjectModal from '../components/AddProjectModal';
import projectService from '../services/projectService';

const CATEGORIES = ['Website', 'Mobile App', 'AI/ML'];
const COLORS     = ['#1B2E6B','#2E6DB4','#4A90D9','#4C3A9E','#1A6B3C','#8B5E0A','#9B1C1C','#A85010'];

const CAT_COLOR = {
  'Website':    '#2E6DB4',
  'Mobile App': '#4C3A9E',
  'AI/ML':      '#A85010',
};

export default function ProjectsPage() {
  const {
    projects, setProjects, clients, fmt,
    isBD, isManagement,
    showAddProject, setShowAddProject,
  } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [filterStatus, setStatus]   = useState('all');
  const [filterCat, setCat]         = useState('all');
  const [loading, setLoading]       = useState(false);
  const [apiError, setApiError]     = useState(null);

  /* Edit state */
  const [showEdit, setShowEdit]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  /* Delete state */
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  /* ── Load on mount ─────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const data = await projectService.getAll();
        setProjects(data);
      } catch {
        setApiError('Failed to load projects. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Filtered list ─────────────────────────────────── */
  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.name.toLowerCase().includes(q) ||
      (p.client || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchCat    = filterCat    === 'all' || p.category === filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  /* ── Edit handlers ─────────────────────────────────── */
  const openEdit = (e, project) => {
    e.stopPropagation();
    setEditTarget(project);
    setEditForm({
      name:             project.name             || '',
      clientId:         project.clientId         || '',
      category:         project.category         || 'Website',
      status:           project.status           || 'active',
      completion:       project.completion       ?? 0,
      budget:           project.budget           || '',
      startDate:        project.startDate        || '',
      endDate:          project.endDate          || '',
      description:      project.description      || '',
      clientCommitment: project.clientCommitment || '',
      color:            project.color            || '#2E6DB4',
    });
    setEditErrors({});
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name?.trim()) { setEditErrors({ name: 'Required' }); return; }
    setEditSaving(true);
    try {
      const updated = await projectService.update(editTarget.id, editForm);
      setProjects(prev => prev.map(p => p.id === editTarget.id ? updated : p));
      setShowEdit(false);
    } catch (err) {
      setEditErrors({ api: err.response?.data?.message || 'Failed to save.' });
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Delete handlers ───────────────────────────────── */
  const openDelete = (e, id) => {
    e.stopPropagation();
    setConfirmDel(id);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectService.delete(confirmDel);
      setProjects(prev => prev.filter(p => p.id !== confirmDel));
    } catch {
      alert('Failed to delete project.');
    } finally {
      setDeleting(false);
      setConfirmDel(null);
    }
  };

  const eSet = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        sub={`${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
        action={(isBD || isManagement) && (
          <Btn icon={<Plus size={14}/>} onClick={() => setShowAddProject(true)}>New Project</Btn>
        )}
      />

      {apiError && (
        <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14, marginBottom:16 }}>{apiError}</div>
      )}

      {/* Search + Filters */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ flex:1, minWidth:220, maxWidth:340, display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36 }}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or clients…"
            style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}/>
        </div>
        <FilterPills
          options={['all','active','completed','on-hold']}
          value={filterStatus}
          onChange={setStatus}
        />
        <FilterPills
          options={['all','Website','Mobile App','AI/ML']}
          value={filterCat}
          onChange={setCat}
        />
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>
          {filtered.length} of {projects.length}
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:14 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height:210, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.5 }}/>
          ))}
        </div>
      )}

      {/* Project cards */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:14 }}>
          {filtered.map(p => {
            const client     = clients.find(c => c.id === p.clientId || c.id === parseInt(p.clientId));
            const openBlockers = (p.blockers || []).filter(b => !b.resolved).length;
            return (
              <Card key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)} style={{ padding:18 }}>

                {/* Header */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                  <div style={{ width:3, minWidth:3, height:44, borderRadius:3, background:p.color||'#2E6DB4', flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, lineHeight:1.3, color:'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize:13, color:'#2E6DB4', marginTop:3, fontWeight:600, cursor:'pointer' }}
                      onClick={e => { e.stopPropagation(); client && navigate(`/clients/${client.id}`); }}>
                      {p.client || '—'}
                    </div>
                  </div>
                  <StatusBadge status={p.status}/>
                </div>

                {/* Badges */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                  <Badge label={p.category} color={CAT_COLOR[p.category]||'#2E6DB4'}/>
                  <Badge label={fmt(p.budget)} color="var(--text-muted)" bg="var(--bg-elevated)"/>
                  {p.pmOwnerName && <Badge label={p.pmOwnerName} color="#1A6B3C"/>}
                </div>

                {/* Client commitment */}
                {p.clientCommitment && (
                  <div style={{ padding:'6px 9px', borderRadius:6, background:'#FBF5EC', border:'1px solid #8B5E0A20', marginBottom:10, fontSize:12, color:'#8B5E0A', lineHeight:1.5 }}>
                    <strong>Commitment:</strong> {p.clientCommitment.slice(0,90)}{p.clientCommitment.length > 90 ? '…' : ''}
                  </div>
                )}

                {/* Completion */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>Completion</span>
                    <span style={{ fontSize:13, fontWeight:700, color:p.color||'#2E6DB4' }}>{p.completion || 0}%</span>
                  </div>
                  <ProgressBar value={p.completion||0} color={p.color||'#2E6DB4'} height={4} bg="var(--bg-elevated)"/>
                </div>

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'var(--text-muted)', paddingTop:10, borderTop:'1px solid var(--border)', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Calendar size={11}/>
                    {formatDate(p.endDate)}
                  </div>
                  {openBlockers > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:3, color:'var(--danger)', fontWeight:700 }}>
                      <AlertCircle size={11}/>
                      {openBlockers} blocker{openBlockers > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(isManagement || isBD) && (
                  <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={e => openEdit(e, p)} style={{ flex:1, padding:'5px 0', fontSize:12, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'#2E6DB4', fontWeight:600, cursor:'pointer' }}>
                      Edit
                    </button>
                    {isManagement && (
                      <button onClick={e => openDelete(e, p.id)} style={{ flex:1, padding:'5px 0', fontSize:12, borderRadius:6, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontWeight:600, cursor:'pointer' }}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState message={search ? `No projects match "${search}"` : 'No projects yet.'}/>
      )}

      {/* Add Project Modal */}
      {showAddProject && <AddProjectModal/>}

      {/* ── Edit Modal ─────────────────────────────────── */}
      {showEdit && (
        <Modal title="Edit Project" subtitle="Update project details" onClose={() => setShowEdit(false)} width={620}
          footer={
            <>
              <Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Btn>
              <Btn onClick={handleSaveEdit} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</Btn>
            </>
          }
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {editErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{editErrors.api}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Project Name" required error={editErrors.name}>
                <input value={editForm.name} onChange={e => eSet('name', e.target.value)} style={inputStyle(editErrors.name)} autoFocus/>
              </Field>
              <Field label="Client">
                <select value={editForm.clientId} onChange={e => eSet('clientId', e.target.value)} style={inputStyle()}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Category">
                <select value={editForm.category} onChange={e => eSet('category', e.target.value)} style={inputStyle()}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={editForm.status} onChange={e => eSet('status', e.target.value)} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </Field>
              <Field label="Completion (%)">
                <input type="number" min={0} max={100} value={editForm.completion} onChange={e => eSet('completion', parseInt(e.target.value)||0)} style={inputStyle()}/>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Budget (₹)">
                <input type="number" value={editForm.budget} onChange={e => eSet('budget', e.target.value)} style={inputStyle()}/>
              </Field>
              <Field label="Start Date">
                <input type="date" value={editForm.startDate} onChange={e => eSet('startDate', e.target.value)} style={inputStyle()}/>
              </Field>
              <Field label="End Date">
                <input type="date" value={editForm.endDate} onChange={e => eSet('endDate', e.target.value)} style={inputStyle()}/>
              </Field>
            </div>

            <Field label="Description">
              <textarea value={editForm.description} onChange={e => eSet('description', e.target.value)} rows={2} style={{...inputStyle(), resize:'vertical'}} placeholder="Project overview…"/>
            </Field>

            <Field label="Client Commitment">
              <textarea value={editForm.clientCommitment} onChange={e => eSet('clientCommitment', e.target.value)} rows={2} style={{...inputStyle(), resize:'vertical', borderColor:'#8B5E0A50'}} placeholder="Delivery promises made to client…"/>
            </Field>

            <Field label="Accent Colour">
              <div style={{ display:'flex', gap:8 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => eSet('color', c)} style={{ width:24, height:24, borderRadius:6, background:c, cursor:'pointer', border:editForm.color===c?'3px solid var(--text)':'2px solid transparent', boxSizing:'border-box' }}/>
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <ConfirmModal
          message="Delete this project? All milestones, payments, blockers and achievements will be permanently removed."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function FilterPills({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:3 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:value===o?'#2E6DB4':'transparent', color:value===o?'#fff':'var(--text-muted)', fontSize:13, cursor:'pointer', fontWeight:value===o?700:400, textTransform:'capitalize', fontFamily:'var(--font-body)' }}>
          {o === 'all' ? 'All' : o}
        </button>
      ))}
    </div>
  );
}
