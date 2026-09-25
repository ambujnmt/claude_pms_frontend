import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Badge, StatusBadge, Btn, Modal, Field, inputStyle, PageHeader, EmptyState, formatDate } from '../components/UI';
import { Target, CheckCircle2, Clock, AlertCircle, FolderKanban, Calendar, ChevronRight, Filter } from 'lucide-react';
import projectService from '../services/projectService';

const MILESTONE_STATUSES = ['upcoming','in-progress','completed','on-hold','overdue'];
const STATUS_META = {
  completed:     { color:'var(--success)',   bg:'#EDF7F2', icon:'✅', label:'Completed' },
  'in-progress': { color:'#4A90D9',          bg:'#EDF4FB', icon:'🔄', label:'In Progress' },
  overdue:       { color:'var(--danger)',     bg:'#FEF2F2', icon:'🔴', label:'Overdue' },
  'on-hold':     { color:'var(--warning)',    bg:'#FBF5EC', icon:'⏸',  label:'On Hold' },
  upcoming:      { color:'var(--text-muted)', bg:'var(--bg-elevated)', icon:'🔵', label:'Upcoming' },
};

export default function MilestonesPage() {
  const { projects, setProjects, dataLoading } = useApp();
  const navigate = useNavigate();

  const [tab, setTab]             = useState('cycle');
  const [filterStatus, setFilter] = useState('all');
  const [filterProject, setFilterP] = useState('all');
  const [search, setSearch]       = useState('');
  const [showEdit, setShowEdit]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [togglingId, setTogglingId] = useState(null);

  /* Flatten milestones */
  const allMilestones = useMemo(() =>
    projects.flatMap(p => (p.milestones||[]).map(m => ({
      ...m,
      projectId:   p.id,
      projectName: p.name,
      projectColor:p.color||'#2E6DB4',
      clientName:  p.client||'',
    })))
  , [projects]);

  const cycleMilestones = allMilestones.filter(m => m.cycleTargeted);

  const filtered = useMemo(() => allMilestones.filter(m => {
    const q = search.toLowerCase();
    return (!search || m.name.toLowerCase().includes(q) || m.projectName.toLowerCase().includes(q))
      && (filterStatus  ==='all' || m.status===filterStatus)
      && (filterProject ==='all' || String(m.projectId)===filterProject);
  }), [allMilestones, search, filterStatus, filterProject]);

  const stats = useMemo(() => ({
    total:      allMilestones.length,
    completed:  allMilestones.filter(m=>m.status==='completed').length,
    inProgress: allMilestones.filter(m=>m.status==='in-progress').length,
    overdue:    allMilestones.filter(m=>m.status==='overdue').length,
    cycleCount: cycleMilestones.length,
    cycleDone:  cycleMilestones.filter(m=>m.status==='completed').length,
  }), [allMilestones, cycleMilestones]);

  const daysUntil = (d) => d ? Math.ceil((new Date(d)-new Date())/(1000*60*60*24)) : null;
  const dueBadge  = (d) => {
    const days = daysUntil(d);
    if (days===null) return null;
    if (days<0)  return { text:`${Math.abs(days)}d overdue`, color:'var(--danger)' };
    if (days===0) return { text:'Due today', color:'var(--danger)' };
    if (days<=3)  return { text:`Due in ${days}d`, color:'var(--warning)' };
    if (days<=7)  return { text:`Due in ${days}d`, color:'#4A90D9' };
    return null;
  };

  const handleToggleCycle = async (m) => {
    setTogglingId(m.id);
    try {
      const toggled = await projectService.toggleCycleTarget(m.projectId, m.id);
      setProjects(prev => prev.map(p => p.id===m.projectId ? { ...p, milestones:p.milestones.map(ms => ms.id===m.id?{...ms,cycleTargeted:toggled}:ms) } : p));
    } catch { alert('Failed to toggle.'); }
    finally { setTogglingId(null); }
  };

  const handleStatusChange = async (m, newStatus) => {
    const upd = { name:m.name, dueDate:m.dueDate, status:newStatus, completedDate:newStatus==='completed'?new Date().toISOString().split('T')[0]:m.completedDate };
    try {
      await projectService.updateMilestone(m.projectId, m.id, upd);
      setProjects(prev => prev.map(p => p.id===m.projectId?{...p,milestones:p.milestones.map(ms=>ms.id===m.id?{...ms,...upd}:ms)}:p));
    } catch { alert('Failed to update status.'); }
  };

  const openEdit = (m) => { setEditTarget(m); setEditForm({ name:m.name, dueDate:m.dueDate||'', status:m.status||'upcoming', completedDate:m.completedDate||'' }); setEditErrors({}); setShowEdit(true); };

  const handleSaveEdit = async () => {
    if (!editForm.name?.trim()) { setEditErrors({ name:'Required' }); return; }
    setEditSaving(true);
    try {
      await projectService.updateMilestone(editTarget.projectId, editTarget.id, editForm);
      setProjects(prev => prev.map(p => p.id===editTarget.projectId?{...p,milestones:p.milestones.map(m=>m.id===editTarget.id?{...m,...editForm}:m)}:p));
      setShowEdit(false);
    } catch (err) { setEditErrors({ api:err.response?.data?.message||'Failed to save.' }); }
    finally { setEditSaving(false); }
  };

  const MilestoneCard = ({ m, showProject=true }) => {
    const meta = STATUS_META[m.status]||STATUS_META.upcoming;
    const due  = dueBadge(m.dueDate);
    const busy = togglingId===m.id;
    return (
      <Card style={{ padding:'13px 16px', borderLeft:`4px solid ${m.projectColor}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{meta.icon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:5 }}>{m.name}</div>
            {showProject && (
              <div onClick={() => navigate(`/projects/${m.projectId}`)} style={{ fontSize:12, color:'#2E6DB4', fontWeight:600, cursor:'pointer', marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:m.projectColor }}/>
                {m.projectName}{m.clientName && <span style={{ color:'var(--text-muted)', fontWeight:400 }}> · {m.clientName}</span>}
              </div>
            )}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <select value={m.status} onChange={e=>handleStatusChange(m,e.target.value)} onClick={e=>e.stopPropagation()} style={{ fontSize:11, padding:'2px 6px', borderRadius:5, border:`1.5px solid ${meta.color}`, background:meta.bg, color:meta.color, fontWeight:700, cursor:'pointer', outline:'none', fontFamily:'var(--font-body)' }}>
                {MILESTONE_STATUSES.map(s=><option key={s} value={s} style={{ background:'var(--bg-card)', color:'var(--text)', textTransform:'capitalize' }}>{s}</option>)}
              </select>
              {m.dueDate && <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Calendar size={10}/>{formatDate(m.dueDate)}</span>}
              {due && <span style={{ fontSize:11, fontWeight:700, color:due.color, padding:'2px 6px', borderRadius:4, background:`${due.color}15` }}>{due.text}</span>}
              {m.completedDate && m.status==='completed' && <span style={{ fontSize:11, color:'var(--success)', display:'flex', alignItems:'center', gap:3 }}><CheckCircle2 size={10}/>Done {formatDate(m.completedDate)}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            <button onClick={()=>handleToggleCycle(m)} disabled={busy}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:6, border:`1.5px solid ${m.cycleTargeted?'#2E6DB4':'var(--border)'}`, background:m.cycleTargeted?'#EDF4FB':'var(--bg-elevated)', color:m.cycleTargeted?'#2E6DB4':'var(--text-muted)', fontSize:11, fontWeight:700, cursor:busy?'wait':'pointer' }}>
              <Target size={11}/>{busy?'…':m.cycleTargeted?'In Cycle':'Add to Cycle'}
            </button>
            <button onClick={()=>openEdit(m)} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'#2E6DB4', fontSize:11, fontWeight:700, cursor:'pointer' }}>Edit</button>
            <button onClick={()=>navigate(`/projects/${m.projectId}`)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center' }}><ChevronRight size={13}/></button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="fade-in">
      <PageHeader title="Milestones" sub="Track delivery milestones across all active projects"/>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total',       value:stats.total,      icon:<FolderKanban size={16}/>, color:'#1B2E6B', bg:'#EEF2FA' },
          { label:'Completed',   value:stats.completed,  icon:<CheckCircle2 size={16}/>, color:'var(--success)', bg:'#EDF7F2' },
          { label:'In Progress', value:stats.inProgress, icon:<Clock size={16}/>,        color:'#4A90D9', bg:'#EDF4FB' },
          { label:'Overdue',     value:stats.overdue,    icon:<AlertCircle size={16}/>,  color:'var(--danger)', bg:'#FEF2F2' },
          { label:'This Cycle',  value:`${stats.cycleDone}/${stats.cycleCount}`, icon:<Target size={16}/>, color:'#4C3A9E', bg:'#F0EDFA' },
        ].map(k => (
          <Card key={k.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderTop:`3px solid ${k.color}` }}>
            <div style={{ width:34, height:34, borderRadius:8, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', color:k.color, flexShrink:0 }}>{k.icon}</div>
            <div><div style={{ fontSize:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div><div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{k.label}</div></div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {[['cycle','This Cycle'],['all','All Milestones']].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:7, border:'none', cursor:'pointer', background:tab===key?'#1B2E6B':'transparent', color:tab===key?'#fff':'var(--text-muted)', fontSize:14, fontWeight:tab===key?700:400, fontFamily:'var(--font-body)', transition:'all 0.13s' }}>
            {label}
            {key==='cycle' && stats.cycleCount>0 && <span style={{ marginLeft:4, background:tab==='cycle'?'rgba(255,255,255,0.25)':'#2E6DB4', color:'#fff', borderRadius:10, fontSize:11, fontWeight:700, padding:'1px 6px' }}>{stats.cycleCount}</span>}
          </button>
        ))}
      </div>

      {dataLoading && <div style={{ textAlign:'center', padding:28, color:'var(--text-muted)', fontSize:14 }}>Loading milestones…</div>}

      {/* Cycle tab */}
      {!dataLoading && tab==='cycle' && (
        <div>
          {cycleMilestones.length===0
            ? (
              <Card style={{ padding:32, textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🎯</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1B2E6B', marginBottom:8 }}>No milestones in this cycle</div>
                <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:16 }}>Click <strong>Add to Cycle</strong> on any milestone to track it here.</div>
                <Btn variant="outline" onClick={()=>setTab('all')}>View All Milestones</Btn>
              </Card>
            ) : (
              <div>
                {/* Cycle progress */}
                <Card style={{ padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>Cycle Progress</span>
                      <span style={{ fontSize:13, fontWeight:800, color:'#4C3A9E' }}>{stats.cycleDone}/{stats.cycleCount} done</span>
                    </div>
                    <div style={{ height:8, background:'var(--bg-elevated)', borderRadius:8, overflow:'hidden' }}>
                      <div style={{ width:`${stats.cycleCount>0?Math.round((stats.cycleDone/stats.cycleCount)*100):0}%`, height:'100%', background:'#4C3A9E', borderRadius:8, transition:'width 0.5s ease' }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, color:'#4C3A9E', minWidth:60, textAlign:'right' }}>
                    {stats.cycleCount>0?Math.round((stats.cycleDone/stats.cycleCount)*100):0}%
                  </div>
                </Card>
                {['in-progress','overdue','upcoming','on-hold','completed'].map(status => {
                  const group = cycleMilestones.filter(m=>m.status===status);
                  if (!group.length) return null;
                  const meta = STATUS_META[status];
                  return (
                    <div key={status} style={{ marginBottom:20 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:meta.color }}/>
                        <h3 style={{ fontSize:13, fontWeight:700, color:meta.color, textTransform:'uppercase', letterSpacing:'0.5px' }}>{meta.label}</h3>
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>({group.length})</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {group.map(m=><MilestoneCard key={m.id} m={m}/>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* All milestones tab */}
      {!dataLoading && tab==='all' && (
        <div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36, flex:1, minWidth:200, maxWidth:300 }}>
              <Filter size={12} color="var(--text-muted)"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search milestones…" style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}/>
            </div>
            <select value={filterStatus} onChange={e=>setFilter(e.target.value)} style={{ ...inputStyle(), width:'auto', height:36, padding:'0 12px', fontSize:13 }}>
              <option value="all">All Statuses</option>
              {MILESTONE_STATUSES.map(s=><option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}
            </select>
            <select value={filterProject} onChange={e=>setFilterP(e.target.value)} style={{ ...inputStyle(), width:'auto', height:36, padding:'0 12px', fontSize:13 }}>
              <option value="all">All Projects</option>
              {projects.map(p=><option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
            <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{filtered.length} milestone{filtered.length!==1?'s':''}</span>
          </div>

          {filtered.length===0 && <EmptyState message="No milestones match your filters."/>}

          {filtered.length>0 && (() => {
            const byProject = {};
            filtered.forEach(m => {
              if (!byProject[m.projectId]) byProject[m.projectId] = { name:m.projectName, color:m.projectColor, client:m.clientName, milestones:[] };
              byProject[m.projectId].milestones.push(m);
            });
            return Object.entries(byProject).map(([pId, group]) => {
              const done = group.milestones.filter(m=>m.status==='completed').length;
              const total= group.milestones.length;
              return (
                <div key={pId} style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, cursor:'pointer' }} onClick={()=>navigate(`/projects/${pId}`)}>
                    <div style={{ width:12, height:12, borderRadius:3, background:group.color }}/>
                    <span style={{ fontSize:14, fontWeight:700, color:'#1B2E6B' }}>{group.name}</span>
                    {group.client && <span style={{ fontSize:12, color:'var(--text-muted)' }}>· {group.client}</span>}
                    <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>{done}/{total} done</span>
                    <div style={{ width:80, height:4, background:'var(--bg-elevated)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${total>0?(done/total)*100:0}%`, height:'100%', background:group.color, borderRadius:4 }}/>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)"/>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, paddingLeft:22, borderLeft:`2px solid ${group.color}30` }}>
                    {group.milestones.map(m=><MilestoneCard key={m.id} m={m} showProject={false}/>)}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Edit modal */}
      {showEdit && editTarget && (
        <Modal title="Edit Milestone" subtitle={editTarget.projectName} onClose={() => setShowEdit(false)} width={480}
          footer={<><Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Btn><Btn onClick={handleSaveEdit} disabled={editSaving}>{editSaving?'Saving…':'Save Changes'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {editErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{editErrors.api}</div>}
            <Field label="Milestone Name" required error={editErrors.name}><input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={inputStyle(editErrors.name)} autoFocus/></Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Status"><select value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>{MILESTONE_STATUSES.map(s=><option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}</select></Field>
              <Field label="Due Date"><input type="date" value={editForm.dueDate} onChange={e=>setEditForm(f=>({...f,dueDate:e.target.value}))} style={inputStyle()}/></Field>
            </div>
            <Field label="Completed Date"><input type="date" value={editForm.completedDate||''} onChange={e=>setEditForm(f=>({...f,completedDate:e.target.value}))} style={inputStyle()}/></Field>
            {editForm.status!=='completed' && (
              <button onClick={()=>setEditForm(f=>({...f,status:'completed',completedDate:f.completedDate||new Date().toISOString().split('T')[0]}))} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:7, border:'1.5px solid var(--success)', background:'#EDF7F2', color:'var(--success)', fontSize:13, fontWeight:700, cursor:'pointer', width:'fit-content' }}>
                <CheckCircle2 size={14}/> Mark as Completed
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
