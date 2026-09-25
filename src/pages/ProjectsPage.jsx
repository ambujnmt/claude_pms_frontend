import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, StatusBadge, ProgressBar, Badge, Btn, Modal, Field,
  inputStyle, ConfirmModal, PageHeader, EmptyState, formatDate,
} from '../components/UI';
import UserMultiSelect from '../components/UserMultiSelect';
import { Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import AddProjectModal from '../components/AddProjectModal';
import projectService from '../services/projectService';

const COLORS = ['#1B2E6B','#2E6DB4','#4A90D9','#4C3A9E','#1A6B3C','#8B5E0A','#9B1C1C','#A85010'];
const BD_ROLES = ['bd', 'management', 'super_admin'];
const PM_ROLES = ['pm', 'management', 'super_admin'];

export default function ProjectsPage() {
  const { projects, setProjects, clients, categories, users, fmt, isBD, isManagement, showAddProject, setShowAddProject, dataLoading } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]       = useState('');
  const [filterStatus, setStatus] = useState('all');
  const [filterCat, setCat]       = useState('all');
  const [showEdit, setShowEdit]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const catColor = (name) => categories.find(c => c.name === name)?.color || '#2E6DB4';

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const ms = !search || p.name.toLowerCase().includes(q) || (p.client||'').toLowerCase().includes(q);
    return ms && (filterStatus==='all'||p.status===filterStatus) && (filterCat==='all'||p.category===filterCat);
  });

  const openEdit = (e, project) => {
    e.stopPropagation();
    setEditTarget(project);
    setEditForm({
      name:project.name||'', clientId:project.clientId||'', category:project.category||categories[0]?.name||'',
      status:project.status||'active', completion:project.completion??0, budget:project.budget||'',
      startDate:project.startDate||'', endDate:project.endDate||'', description:project.description||'',
      clientCommitment:project.clientCommitment||'', color:project.color||'#2E6DB4',
      bdOwner: project.bdOwner || '', pmOwner: project.pmOwner || '',
      resources: project.resourceIds || [],
    });
    setEditErrors({}); setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name?.trim()) { setEditErrors({ name:'Required' }); return; }
    setEditSaving(true);
    try {
      const updated = await projectService.update(editTarget.id, editForm);
      setProjects(prev => prev.map(p => p.id===editTarget.id?updated:p));
      setShowEdit(false);
    } catch (err) {
      setEditErrors({ api:err.response?.data?.message||'Failed to save.' });
    } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await projectService.delete(confirmDel);
      setProjects(prev => prev.filter(p => p.id!==confirmDel));
    } catch { alert('Failed to delete project.'); }
    setConfirmDel(null);
  };

  const eSet = (k,v) => setEditForm(f=>({...f,[k]:v}));

  return (
    <div className="fade-in">
      <PageHeader
        sub={`${projects.length} project${projects.length!==1?'s':''} total`}
        action={(isBD||isManagement) && <Btn icon={<Plus size={14}/>} onClick={() => setShowAddProject(true)}>New Project</Btn>}
      />

      {/* Filters */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ flex:1, minWidth:220, maxWidth:340, display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36 }}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}/>
        </div>
        <Pills options={['all','active','completed','on-hold']} value={filterStatus} onChange={setStatus}/>
        <Pills options={['all', ...categories.map(c=>c.name)]} value={filterCat} onChange={setCat}/>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{filtered.length} of {projects.length}</span>
      </div>

      {dataLoading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height:210, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.5 }}/>)}
        </div>
      )}

      {!dataLoading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px,1fr))', gap:14 }}>
          {filtered.map(p => {
            const client = clients.find(c => c.id===p.clientId||c.id===parseInt(p.clientId));
            const openBlockers = (p.blockers||[]).filter(b=>!b.resolved).length;
            const resourceCount = (p.resources||[]).length;
            return (
              <Card key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)} style={{ padding:18 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                  <div style={{ width:3, minWidth:3, height:44, borderRadius:3, background:p.color||'#2E6DB4', flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, lineHeight:1.3 }}>{p.name}</div>
                    <div onClick={e=>{e.stopPropagation();client&&navigate(`/clients/${client.id}`);}} style={{ fontSize:13, color:'#2E6DB4', marginTop:3, fontWeight:600, cursor:'pointer' }}>{p.client||'—'}</div>
                  </div>
                  <StatusBadge status={p.status}/>
                </div>

                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  <Badge label={p.category} color={catColor(p.category)}/>
                  <Badge label={fmt(p.budget)} color="var(--text-muted)" bg="var(--bg-elevated)"/>
                  {p.bdOwnerName && <Badge label={`BD: ${p.bdOwnerName}`} color="#4C3A9E"/>}
                  {resourceCount > 0 && <Badge label={`${resourceCount} resource${resourceCount!==1?'s':''}`} color="#1A6B3C"/>}
                </div>

                {p.clientCommitment && (
                  <div style={{ padding:'5px 8px', borderRadius:6, background:'#FBF5EC', border:'1px solid #8B5E0A20', marginBottom:10, fontSize:12, color:'#8B5E0A', lineHeight:1.5 }}>
                    <strong>Commitment:</strong> {p.clientCommitment.slice(0,80)}{p.clientCommitment.length>80?'…':''}
                  </div>
                )}

                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>Completion</span>
                    <span style={{ fontSize:13, fontWeight:700, color:p.color||'#2E6DB4' }}>{p.completion||0}%</span>
                  </div>
                  <ProgressBar value={p.completion||0} color={p.color||'#2E6DB4'} height={4} bg="var(--bg-elevated)"/>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', paddingTop:10, borderTop:'1px solid var(--border)', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={11}/>{formatDate(p.endDate)}</div>
                  {openBlockers>0 && <div style={{ display:'flex', alignItems:'center', gap:3, color:'var(--danger)', fontWeight:700 }}><AlertCircle size={11}/>{openBlockers} blocker{openBlockers>1?'s':''}</div>}
                </div>

                {(isManagement||isBD) && (
                  <div style={{ display:'flex', gap:6 }} onClick={e=>e.stopPropagation()}>
                    <button onClick={e=>openEdit(e,p)} style={{ flex:1, padding:'5px 0', fontSize:12, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'#2E6DB4', fontWeight:600, cursor:'pointer' }}>Edit</button>
                    {isManagement && <button onClick={e=>{e.stopPropagation();setConfirmDel(p.id);}} style={{ flex:1, padding:'5px 0', fontSize:12, borderRadius:6, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontWeight:600, cursor:'pointer' }}>Delete</button>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!dataLoading && filtered.length===0 && <EmptyState message={search?`No projects match "${search}"`:'No projects yet.'}/>}

      {showAddProject && <AddProjectModal/>}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Project" onClose={() => setShowEdit(false)} width={660}
          footer={<><Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Btn><Btn onClick={handleSaveEdit} disabled={editSaving}>{editSaving?'Saving…':'Save Changes'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {editErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{editErrors.api}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Project Name" required error={editErrors.name}><input value={editForm.name} onChange={e=>eSet('name',e.target.value)} style={inputStyle(editErrors.name)} autoFocus/></Field>
              <Field label="Client"><select value={editForm.clientId} onChange={e=>eSet('clientId',e.target.value)} style={inputStyle()}><option value="">No client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Category">
                <select value={editForm.category} onChange={e=>eSet('category',e.target.value)} style={inputStyle()}>
                  {categories.map(c=><option key={c.id} value={c.name}>{c.icon?`${c.icon} `:''}{c.name}</option>)}
                </select>
              </Field>
              <Field label="Status"><select value={editForm.status} onChange={e=>eSet('status',e.target.value)} style={inputStyle()}><option value="active">Active</option><option value="completed">Completed</option><option value="on-hold">On Hold</option></select></Field>
              <Field label="Completion %"><input type="number" min={0} max={100} value={editForm.completion} onChange={e=>eSet('completion',parseInt(e.target.value)||0)} style={inputStyle()}/></Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Budget (₹)"><input type="number" value={editForm.budget} onChange={e=>eSet('budget',e.target.value)} style={inputStyle()}/></Field>
              <Field label="Start Date"><input type="date" value={editForm.startDate} onChange={e=>eSet('startDate',e.target.value)} style={inputStyle()}/></Field>
              <Field label="End Date"><input type="date" value={editForm.endDate} onChange={e=>eSet('endDate',e.target.value)} style={inputStyle()}/></Field>
            </div>

            {/* BD Owner / PM Owner */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="BD Owner">
                <select value={editForm.bdOwner} onChange={e=>eSet('bdOwner',e.target.value)} style={inputStyle()}>
                  <option value="">Unassigned</option>
                  {users.filter(u=>BD_ROLES.includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="PM Owner">
                <select value={editForm.pmOwner} onChange={e=>eSet('pmOwner',e.target.value)} style={inputStyle()}>
                  <option value="">Unassigned</option>
                  {users.filter(u=>PM_ROLES.includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>

            {/* Resources multi-select */}
            <Field label="Resources (developers, designers, QA, etc.)">
              <UserMultiSelect users={users} value={editForm.resources||[]} onChange={(v) => eSet('resources', v)} placeholder="Search team members to assign…" />
            </Field>

            <Field label="Description"><textarea value={editForm.description} onChange={e=>eSet('description',e.target.value)} rows={2} style={{...inputStyle(),resize:'vertical'}}/></Field>
            <Field label="Client Commitment"><textarea value={editForm.clientCommitment} onChange={e=>eSet('clientCommitment',e.target.value)} rows={2} style={{...inputStyle(),resize:'vertical',borderColor:'#8B5E0A50'}}/></Field>
            <Field label="Colour">
              <div style={{ display:'flex', gap:8 }}>
                {COLORS.map(c=><div key={c} onClick={()=>eSet('color',c)} style={{ width:24, height:24, borderRadius:6, background:c, cursor:'pointer', border:editForm.color===c?'3px solid var(--text)':'2px solid transparent', boxSizing:'border-box' }}/>)}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Delete this project? All milestones, payments, blockers and achievements will be removed." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}

function Pills({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:3, flexWrap:'wrap' }}>
      {options.map(o=><button key={o} onClick={()=>onChange(o)} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:value===o?'#2E6DB4':'transparent', color:value===o?'#fff':'var(--text-muted)', fontSize:13, cursor:'pointer', fontWeight:value===o?700:400, fontFamily:'var(--font-body)' }}>{o==='all'?'All':o}</button>)}
    </div>
  );
}
