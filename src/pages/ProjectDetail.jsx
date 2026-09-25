import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, StatusBadge, ProgressBar, Badge, Btn, Modal, Field,
  inputStyle, ConfirmModal, ActionMenu, formatDate, EmptyState, SectionTitle,
} from '../components/UI';
import UserMultiSelect from '../components/UserMultiSelect';
import {
  ArrowLeft, Edit2, AlertCircle, Trophy,
  CreditCard, Milestone, Calendar, Target,
  Plus, Trash2, CheckCheck,
} from 'lucide-react';
import projectService from '../services/projectService';

const TABS = [
  { key:'overview',      label:'Overview',     icon:Edit2 },
  { key:'milestones',    label:'Milestones',   icon:Milestone },
  { key:'payments',      label:'Payments',     icon:CreditCard },
  { key:'blockers',      label:'Blockers',     icon:AlertCircle },
  { key:'achievements',  label:'Wins',         icon:Trophy },
];

const MILESTONE_STATUSES = ['upcoming','in-progress','completed','on-hold','overdue'];
const PAYMENT_TYPES      = ['Advance','Milestone','Final'];
const PAYMENT_STATUSES   = ['upcoming','pending','received'];
const BLOCKER_TYPES      = ['communication','technical','resource','client-delay','scope-change','other'];
const COLORS             = ['#1B2E6B','#2E6DB4','#4A90D9','#4C3A9E','#1A6B3C','#8B5E0A','#9B1C1C','#A85010'];
const BD_ROLES           = ['bd','management','super_admin'];
const PM_ROLES           = ['pm','management','super_admin'];

const STATUS_COLOR = {
  completed:     'var(--success)',
  'in-progress': '#4A90D9',
  overdue:       'var(--danger)',
  'on-hold':     'var(--warning)',
  upcoming:      'var(--text-muted)',
};

const PAY_STATUS_COLOR = {
  received: 'var(--success)',
  pending:  'var(--warning)',
  upcoming: 'var(--text-muted)',
};

export default function ProjectDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const {
    projects, setProjects, clients, categories, users, fmt, isManagement, isBD,
  } = useApp();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('overview');

  const [showEdit, setShowEdit]     = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  const [showMilestone, setShowMilestone]   = useState(false);
  const [milestoneForm, setMilestoneForm]   = useState({ name:'', dueDate:'', status:'upcoming' });
  const [milestoneEditing, setMilestoneEditing] = useState(null);
  const [milestoneSaving, setMilestoneSaving]   = useState(false);
  const [milestoneErrors, setMilestoneErrors]   = useState({});
  const [confirmDelMilestone, setConfirmDelMilestone] = useState(null);

  const [showPayment, setShowPayment]   = useState(false);
  const [paymentForm, setPaymentForm]   = useState({ amount:'', type:'Milestone', date:'', status:'upcoming', notes:'' });
  const [paymentEditing, setPaymentEditing] = useState(null);
  const [paymentSaving, setPaymentSaving]   = useState(false);
  const [paymentErrors, setPaymentErrors]   = useState({});
  const [confirmDelPayment, setConfirmDelPayment] = useState(null);

  const [showBlocker, setShowBlocker]     = useState(false);
  const [blockerForm, setBlockerForm]     = useState({ type:'technical', description:'' });
  const [blockerSaving, setBlockerSaving] = useState(false);
  const [blockerErrors, setBlockerErrors] = useState({});
  const [confirmDelBlocker, setConfirmDelBlocker] = useState(null);

  const [showAchievement, setShowAchievement]   = useState(false);
  const [achievementText, setAchievementText]   = useState('');
  const [achievementSaving, setAchievementSaving] = useState(false);
  const [confirmDelAchievement, setConfirmDelAchievement] = useState(null);

  const [completionVal, setCompletionVal] = useState(0);
  const [savingCompletion, setSavingCompletion] = useState(false);

  const numId = parseInt(id) || id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let found = projects.find(p => p.id === numId || p.id === id);
        if (!found || !found.milestones) {
          found = await projectService.getById(id);
        }
        setProject(found);
        setCompletionVal(found.completion || 0);
      } catch {
        setError('Project not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const client = project ? clients.find(c => c.id === project.clientId || c.id === parseInt(project.clientId)) : null;

  const updateLocal = (changes) => setProject(prev => ({ ...prev, ...changes }));

  const openEditProject = () => {
    setEditForm({
      name:             project.name             || '',
      clientId:         project.clientId         || '',
      category:         project.category         || categories[0]?.name || '',
      status:           project.status           || 'active',
      budget:           project.budget           || '',
      startDate:        project.startDate        || '',
      endDate:          project.endDate          || '',
      description:      project.description      || '',
      clientCommitment: project.clientCommitment || '',
      color:            project.color            || '#2E6DB4',
      bdOwner:          project.bdOwner          || '',
      pmOwner:          project.pmOwner          || '',
      resources:        project.resourceIds      || [],
    });
    setEditErrors({});
    setShowEdit(true);
  };

  const handleSaveProject = async () => {
    if (!editForm.name?.trim()) { setEditErrors({ name:'Required' }); return; }
    setEditSaving(true);
    try {
      const updated = await projectService.update(project.id, editForm);
      setProject(prev => ({ ...prev, ...updated }));
      setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      setShowEdit(false);
    } catch (err) {
      setEditErrors({ api: err.response?.data?.message || 'Failed to save.' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveCompletion = async () => {
    setSavingCompletion(true);
    try {
      await projectService.updateCompletion(project.id, completionVal);
      updateLocal({ completion: completionVal });
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, completion: completionVal } : p));
    } catch {
      alert('Failed to update completion.');
    } finally {
      setSavingCompletion(false);
    }
  };

  const openAddMilestone = () => { setMilestoneForm({ name:'', dueDate:'', status:'upcoming' }); setMilestoneEditing(null); setMilestoneErrors({}); setShowMilestone(true); };
  const openEditMilestone = (m) => {
    setMilestoneForm({ name: m.name, dueDate: m.dueDate||'', status: m.status||'upcoming', completedDate: m.completedDate||'' });
    setMilestoneEditing(m.id);
    setMilestoneErrors({});
    setShowMilestone(true);
  };

  const handleSaveMilestone = async () => {
    if (!milestoneForm.name?.trim()) { setMilestoneErrors({ name:'Required' }); return; }
    setMilestoneSaving(true);
    try {
      if (milestoneEditing) {
        await projectService.updateMilestone(project.id, milestoneEditing, milestoneForm);
        updateLocal({ milestones: project.milestones.map(m => m.id === milestoneEditing ? { ...m, ...milestoneForm, dueDate: milestoneForm.dueDate } : m) });
      } else {
        const created = await projectService.addMilestone(project.id, milestoneForm);
        updateLocal({ milestones: [...(project.milestones||[]), created] });
      }
      setShowMilestone(false);
    } catch (err) {
      setMilestoneErrors({ api: err.response?.data?.message || 'Failed to save.' });
    } finally {
      setMilestoneSaving(false);
    }
  };

  const handleDeleteMilestone = async () => {
    try {
      await projectService.deleteMilestone(project.id, confirmDelMilestone);
      updateLocal({ milestones: project.milestones.filter(m => m.id !== confirmDelMilestone) });
    } catch { alert('Failed to delete milestone.'); }
    setConfirmDelMilestone(null);
  };

  const handleToggleCycle = async (milestoneId) => {
    try {
      const toggled = await projectService.toggleCycleTarget(project.id, milestoneId);
      updateLocal({ milestones: project.milestones.map(m => m.id === milestoneId ? { ...m, cycleTargeted: toggled } : m) });
    } catch { alert('Failed to toggle cycle target.'); }
  };

  const openAddPayment = () => { setPaymentForm({ amount:'', type:'Milestone', date:'', status:'upcoming', notes:'' }); setPaymentEditing(null); setPaymentErrors({}); setShowPayment(true); };
  const openEditPayment = (pay) => {
    setPaymentForm({ amount: pay.amount, type: pay.type, date: pay.date||'', status: pay.status, notes: pay.notes||'' });
    setPaymentEditing(pay.id);
    setPaymentErrors({});
    setShowPayment(true);
  };

  const handleSavePayment = async () => {
    if (!paymentForm.amount) { setPaymentErrors({ amount:'Required' }); return; }
    if (!paymentForm.date)   { setPaymentErrors({ date:'Required' }); return; }
    setPaymentSaving(true);
    try {
      if (paymentEditing) {
        await projectService.updatePayment(project.id, paymentEditing, paymentForm);
        updateLocal({ payments: project.payments.map(p => p.id === paymentEditing ? { ...p, ...paymentForm, amount: parseFloat(paymentForm.amount) } : p) });
      } else {
        const created = await projectService.addPayment(project.id, paymentForm);
        updateLocal({ payments: [...(project.payments||[]), created] });
      }
      setShowPayment(false);
    } catch (err) {
      setPaymentErrors({ api: err.response?.data?.message || 'Failed to save.' });
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    try {
      await projectService.deletePayment(project.id, confirmDelPayment);
      updateLocal({ payments: project.payments.filter(p => p.id !== confirmDelPayment) });
    } catch { alert('Failed to delete payment.'); }
    setConfirmDelPayment(null);
  };

  const handleAddBlocker = async () => {
    if (!blockerForm.description?.trim()) { setBlockerErrors({ description:'Required' }); return; }
    setBlockerSaving(true);
    try {
      const created = await projectService.addBlocker(project.id, blockerForm);
      updateLocal({ blockers: [created, ...(project.blockers||[])] });
      setBlockerForm({ type:'technical', description:'' });
      setShowBlocker(false);
    } catch (err) {
      setBlockerErrors({ api: err.response?.data?.message || 'Failed to add.' });
    } finally {
      setBlockerSaving(false);
    }
  };

  const handleResolveBlocker = async (blockerId) => {
    try {
      await projectService.resolveBlocker(project.id, blockerId);
      updateLocal({ blockers: project.blockers.map(b => b.id === blockerId ? { ...b, resolved:true } : b) });
    } catch { alert('Failed to resolve blocker.'); }
  };

  const handleDeleteBlocker = async () => {
    try {
      await projectService.deleteBlocker(project.id, confirmDelBlocker);
      updateLocal({ blockers: project.blockers.filter(b => b.id !== confirmDelBlocker) });
    } catch { alert('Failed to delete blocker.'); }
    setConfirmDelBlocker(null);
  };

  const handleAddAchievement = async () => {
    if (!achievementText.trim()) return;
    setAchievementSaving(true);
    try {
      const created = await projectService.addAchievement(project.id, { description: achievementText });
      updateLocal({ achievements: [created, ...(project.achievements||[])] });
      setAchievementText('');
      setShowAchievement(false);
    } catch { alert('Failed to add achievement.'); }
    finally { setAchievementSaving(false); }
  };

  const handleDeleteAchievement = async () => {
    try {
      await projectService.deleteAchievement(project.id, confirmDelAchievement);
      updateLocal({ achievements: project.achievements.filter(a => a.id !== confirmDelAchievement) });
    } catch { alert('Failed to delete achievement.'); }
    setConfirmDelAchievement(null);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, color:'var(--text-muted)', fontSize:14 }}>
      Loading project…
    </div>
  );

  if (error || !project) return (
    <div style={{ textAlign:'center', padding:40 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
      <div style={{ fontSize:15, color:'var(--text-muted)', marginBottom:20 }}>{error || 'Project not found.'}</div>
      <Btn onClick={() => navigate('/projects')}>← Back to Projects</Btn>
    </div>
  );

  const milestones    = project.milestones   || [];
  const payments      = project.payments     || [];
  const blockers      = project.blockers     || [];
  const achievements  = project.achievements || [];
  const resources     = project.resources    || [];
  const openBlockers  = blockers.filter(b => !b.resolved);
  const totalBudget   = project.budget || 0;
  const received      = payments.filter(p => p.status === 'received').reduce((s,p) => s + p.amount, 0);
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const canEdit = isManagement || isBD;

  const tabBadge = (key) => key === 'blockers' && openBlockers.length > 0 ? openBlockers.length : null;

  const initials = (u) => u.avatar || u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="fade-in">

      {/* ── Back + Header ─────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/projects')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <ArrowLeft size={13}/> Projects
          </button>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:14, height:14, borderRadius:3, background:project.color||'#2E6DB4' }}/>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'#1B2E6B', letterSpacing:'-0.5px', lineHeight:1.2 }}>{project.name}</h1>
              <StatusBadge status={project.status}/>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:5, alignItems:'center' }}>
              {client && (
                <span onClick={() => navigate(`/clients/${client.id}`)} style={{ fontSize:13, color:'#2E6DB4', fontWeight:600, cursor:'pointer' }}>
                  {client.name}
                </span>
              )}
              <Badge label={project.category} color="#4C3A9E"/>
              {project.endDate && <span style={{ fontSize:12, color:'var(--text-muted)' }}>Due {formatDate(project.endDate)}</span>}
            </div>
          </div>
        </div>
        {canEdit && <Btn icon={<Edit2 size={13}/>} onClick={openEditProject}>Edit Project</Btn>}
      </div>

      {/* ── KPI strip ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Completion',   value:`${project.completion||0}%`,                    color:project.color||'#2E6DB4' },
          { label:'Budget',       value:fmt(totalBudget),                                color:'#1B2E6B' },
          { label:'Received',     value:fmt(received),                                   color:'var(--success)' },
          { label:'Milestones',   value:`${completedMilestones}/${milestones.length}`,   color:'#4C3A9E' },
          { label:'Open Blockers',value:openBlockers.length,                             color:openBlockers.length>0?'var(--danger)':'var(--text-muted)' },
        ].map(k => (
          <Card key={k.label} style={{ padding:'12px 14px', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:20, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{k.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Completion slider ──────────────────────────── */}
      <Card style={{ padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:3, height:32, borderRadius:3, background:project.color||'#2E6DB4', flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Overall Completion</span>
            <span style={{ fontSize:16, fontWeight:800, color:project.color||'#2E6DB4' }}>{completionVal}%</span>
          </div>
          <input type="range" min={0} max={100} value={completionVal}
            onChange={e => setCompletionVal(parseInt(e.target.value))}
            style={{ width:'100%', accentColor:project.color||'#2E6DB4', cursor:'pointer' }}
          />
        </div>
        <Btn
          variant={completionVal === (project.completion||0) ? 'ghost' : 'primary'}
          onClick={handleSaveCompletion}
          disabled={savingCompletion || completionVal === (project.completion||0)}
        >
          {savingCompletion ? 'Saving…' : 'Update'}
        </Btn>
      </Card>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {TABS.map(({ key, label, icon:Icon }) => {
          const badge = tabBadge(key);
          return (
            <button key={key} onClick={() => setTab(key)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:7, border:'none', cursor:'pointer', background:tab===key?'#1B2E6B':'transparent', color:tab===key?'#fff':'var(--text-muted)', fontSize:13, fontWeight:tab===key?700:400, transition:'all 0.13s', fontFamily:'var(--font-body)', position:'relative' }}>
              <Icon size={13}/>{label}
              {badge > 0 && <span style={{ marginLeft:2, background:'var(--danger)', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, padding:'1px 5px' }}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ══ OVERVIEW TAB ════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          <Card>
            <SectionTitle>Project Details</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Client',      value: client?.name, link: client ? () => navigate(`/clients/${client.id}`) : null },
                { label:'Category',    value: project.category },
                { label:'Budget',      value: fmt(totalBudget) },
                { label:'Start Date',  value: formatDate(project.startDate) },
                { label:'End Date',    value: formatDate(project.endDate) },
                { label:'BD Owner',    value: project.bdOwnerName },
                { label:'PM Owner',    value: project.pmOwnerName },
              ].filter(r => r.value && r.value !== '—').map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:14, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{row.label}</span>
                  <span onClick={row.link || undefined} style={{ color:row.link?'#2E6DB4':'var(--text)', fontWeight:row.link?700:400, cursor:row.link?'pointer':'default' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Resources chips */}
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Resources</div>
              {resources.length === 0
                ? <div style={{ fontSize:13, color:'var(--text-muted)' }}>No resources assigned yet.</div>
                : (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {resources.map(u => (
                      <div key={u.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px 4px 4px', borderRadius:16, background:'var(--bg-elevated)', border:'1px solid var(--border)' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'#2E6DB4', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{initials(u)}</div>
                        <span style={{ fontSize:13, fontWeight:600 }}>{u.name}</span>
                        <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>· {(u.role||'').replace(/_/g,' ')}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </Card>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {project.description && (
              <Card>
                <SectionTitle>Description</SectionTitle>
                <p style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.8 }}>{project.description}</p>
              </Card>
            )}
            {project.clientCommitment && (
              <Card style={{ background:'#FBF5EC', border:'1px solid #8B5E0A20' }}>
                <SectionTitle>Client Commitment</SectionTitle>
                <p style={{ fontSize:14, color:'#8B5E0A', lineHeight:1.8 }}>{project.clientCommitment}</p>
              </Card>
            )}
            {!project.description && !project.clientCommitment && (
              <EmptyState icon="📋" message="No description or commitment added."/>
            )}
          </div>
        </div>
      )}

      {/* ══ MILESTONES TAB ══════════════════════════════ */}
      {tab === 'milestones' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>
              {completedMilestones} of {milestones.length} completed
            </div>
            {canEdit && <Btn icon={<Plus size={13}/>} onClick={openAddMilestone}>Add Milestone</Btn>}
          </div>

          {milestones.length === 0
            ? <EmptyState icon="🏁" message="No milestones defined yet."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {milestones.map(m => (
                  <Card key={m.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:STATUS_COLOR[m.status]||'var(--text-muted)', flexShrink:0 }}/>

                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3, display:'flex', gap:10 }}>
                        {m.dueDate && <span><Calendar size={10} style={{ marginRight:3 }}/>Due {formatDate(m.dueDate)}</span>}
                        {m.completedDate && <span>✓ Completed {formatDate(m.completedDate)}</span>}
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <StatusBadge status={m.status}/>

                      <button onClick={() => handleToggleCycle(m.id)} title={m.cycleTargeted ? 'Remove from cycle' : 'Add to cycle'}
                        style={{ padding:'4px 8px', borderRadius:5, border:`1.5px solid ${m.cycleTargeted?'#2E6DB4':'var(--border)'}`, background:m.cycleTargeted?'#EDF4FB':'var(--bg-elevated)', color:m.cycleTargeted?'#2E6DB4':'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        <Target size={11}/>{m.cycleTargeted ? 'Targeted' : 'Target'}
                      </button>

                      {canEdit && <ActionMenu onEdit={() => openEditMilestone(m)} onDelete={() => setConfirmDelMilestone(m.id)}/>}
                    </div>
                  </Card>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ══ PAYMENTS TAB ════════════════════════════════ */}
      {tab === 'payments' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', gap:14 }}>
              <span style={{ fontSize:13 }}>💰 Received: <strong style={{ color:'var(--success)' }}>{fmt(received)}</strong></span>
              <span style={{ fontSize:13 }}>📊 Total: <strong>{fmt(totalBudget)}</strong></span>
            </div>
            {isManagement && <Btn icon={<Plus size={13}/>} onClick={openAddPayment}>Add Payment</Btn>}
          </div>

          {payments.length === 0
            ? <EmptyState icon="💳" message="No payments recorded yet."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {payments.map(pay => (
                  <Card key={pay.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:PAY_STATUS_COLOR[pay.status]||'var(--text-muted)', flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>{pay.type} Payment</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                        {formatDate(pay.date)}
                        {pay.notes && ` · ${pay.notes}`}
                      </div>
                    </div>
                    <span style={{ fontSize:20, fontWeight:800, color:PAY_STATUS_COLOR[pay.status]||'var(--text-muted)' }}>{fmt(pay.amount)}</span>
                    <StatusBadge status={pay.status}/>
                    {isManagement && <ActionMenu onEdit={() => openEditPayment(pay)} onDelete={() => setConfirmDelPayment(pay.id)}/>}
                  </Card>
                ))}
              </div>
            )
          }

          {payments.length > 0 && (
            <Card style={{ marginTop:14, padding:'14px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                <span style={{ color:'var(--text-muted)' }}>Payment Progress</span>
                <span style={{ fontWeight:700 }}>{fmt(received)} / {fmt(totalBudget)}</span>
              </div>
              <ProgressBar value={totalBudget > 0 ? Math.round((received/totalBudget)*100) : 0} color="var(--success)" height={8}/>
            </Card>
          )}
        </div>
      )}

      {/* ══ BLOCKERS TAB ════════════════════════════════ */}
      {tab === 'blockers' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>
              {openBlockers.length} open · {blockers.filter(b=>b.resolved).length} resolved
            </div>
            {canEdit && <Btn icon={<Plus size={13}/>} onClick={() => { setBlockerForm({ type:'technical', description:'' }); setBlockerErrors({}); setShowBlocker(true); }}>Add Blocker</Btn>}
          </div>

          {blockers.length === 0
            ? <EmptyState icon="✅" message="No blockers — project is running smoothly."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[...blockers].sort((a,b) => a.resolved - b.resolved).map(b => (
                  <Card key={b.id} style={{ borderLeft:`4px solid ${b.resolved?'var(--success)':'var(--danger)'}`, padding:'13px 16px', opacity:b.resolved?0.7:1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                          <Badge label={b.type} color={b.resolved?'var(--success)':'var(--danger)'}/>
                          {b.resolved && <Badge label="Resolved" color="var(--success)"/>}
                          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{formatDate(b.addedAt)}</span>
                        </div>
                        <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, margin:0 }}>{b.description}</p>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        {!b.resolved && canEdit && (
                          <button onClick={() => handleResolveBlocker(b.id)}
                            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:6, border:'1px solid var(--success)', background:'#EDF7F2', color:'var(--success)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            <CheckCheck size={12}/> Resolve
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => setConfirmDelBlocker(b.id)}
                            style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ══ ACHIEVEMENTS TAB ════════════════════════════ */}
      {tab === 'achievements' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>{achievements.length} win{achievements.length !== 1 ? 's' : ''} logged</div>
            {canEdit && <Btn icon={<Plus size={13}/>} onClick={() => { setAchievementText(''); setShowAchievement(true); }}>Log Win</Btn>}
          </div>

          {achievements.length === 0
            ? <EmptyState icon="🏆" message="No wins logged yet. Celebrate the milestones!"/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {achievements.map(a => (
                  <Card key={a.id} style={{ borderLeft:'4px solid #4C3A9E', padding:'13px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ fontSize:20, flexShrink:0 }}>🏆</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, margin:0 }}>{a.description}</p>
                      <span style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, display:'block' }}>{formatDate(a.addedAt)}</span>
                    </div>
                    {canEdit && (
                      <button onClick={() => setConfirmDelAchievement(a.id)}
                        style={{ padding:'4px 8px', borderRadius:5, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontSize:12, cursor:'pointer' }}>
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════ */}

      {/* Edit Project */}
      {showEdit && (
        <Modal title="Edit Project" onClose={() => setShowEdit(false)} width={660}
          footer={<><Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Btn><Btn onClick={handleSaveProject} disabled={editSaving}>{editSaving?'Saving…':'Save Changes'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {editErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{editErrors.api}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Project Name" required error={editErrors.name}>
                <input value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} style={inputStyle(editErrors.name)} autoFocus/>
              </Field>
              <Field label="Client">
                <select value={editForm.clientId||''} onChange={e => setEditForm(f=>({...f,clientId:e.target.value}))} style={inputStyle()}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Category">
                <select value={editForm.category} onChange={e => setEditForm(f=>({...f,category:e.target.value}))} style={inputStyle()}>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={editForm.status} onChange={e => setEditForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </Field>
              <Field label="Budget (₹)">
                <input type="number" value={editForm.budget} onChange={e => setEditForm(f=>({...f,budget:e.target.value}))} style={inputStyle()}/>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Start Date"><input type="date" value={editForm.startDate} onChange={e => setEditForm(f=>({...f,startDate:e.target.value}))} style={inputStyle()}/></Field>
              <Field label="End Date"><input type="date" value={editForm.endDate} onChange={e => setEditForm(f=>({...f,endDate:e.target.value}))} style={inputStyle()}/></Field>
            </div>

            {/* BD Owner / PM Owner */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="BD Owner">
                <select value={editForm.bdOwner||''} onChange={e => setEditForm(f=>({...f,bdOwner:e.target.value}))} style={inputStyle()}>
                  <option value="">Unassigned</option>
                  {users.filter(u => BD_ROLES.includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="PM Owner">
                <select value={editForm.pmOwner||''} onChange={e => setEditForm(f=>({...f,pmOwner:e.target.value}))} style={inputStyle()}>
                  <option value="">Unassigned</option>
                  {users.filter(u => PM_ROLES.includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>

            {/* Resources multi-select */}
            <Field label="Resources (developers, designers, QA, etc.)">
              <UserMultiSelect users={users} value={editForm.resources||[]} onChange={(v) => setEditForm(f=>({...f,resources:v}))} placeholder="Search team members to assign…" />
            </Field>

            <Field label="Description">
              <textarea value={editForm.description} onChange={e => setEditForm(f=>({...f,description:e.target.value}))} rows={2} style={{...inputStyle(),resize:'vertical'}}/>
            </Field>
            <Field label="Client Commitment">
              <textarea value={editForm.clientCommitment} onChange={e => setEditForm(f=>({...f,clientCommitment:e.target.value}))} rows={2} style={{...inputStyle(),resize:'vertical',borderColor:'#8B5E0A50'}}/>
            </Field>
            <Field label="Accent Colour">
              <div style={{ display:'flex', gap:8 }}>
                {COLORS.map(c => <div key={c} onClick={() => setEditForm(f=>({...f,color:c}))} style={{ width:24, height:24, borderRadius:6, background:c, cursor:'pointer', border:editForm.color===c?'3px solid var(--text)':'2px solid transparent', boxSizing:'border-box' }}/>)}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {/* Milestone Modal */}
      {showMilestone && (
        <Modal title={milestoneEditing?'Edit Milestone':'Add Milestone'} onClose={() => setShowMilestone(false)} width={480}
          footer={<><Btn variant="ghost" onClick={() => setShowMilestone(false)}>Cancel</Btn><Btn onClick={handleSaveMilestone} disabled={milestoneSaving}>{milestoneSaving?'Saving…':milestoneEditing?'Save':'Add'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {milestoneErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{milestoneErrors.api}</div>}
            <Field label="Milestone Name" required error={milestoneErrors.name}>
              <input value={milestoneForm.name} onChange={e => setMilestoneForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Design Approval" style={inputStyle(milestoneErrors.name)} autoFocus/>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Due Date">
                <input type="date" value={milestoneForm.dueDate} onChange={e => setMilestoneForm(f=>({...f,dueDate:e.target.value}))} style={inputStyle()}/>
              </Field>
              <Field label="Status">
                <select value={milestoneForm.status} onChange={e => setMilestoneForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  {MILESTONE_STATUSES.map(s => <option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                </select>
              </Field>
            </div>
            {milestoneEditing && (
              <Field label="Completed Date">
                <input type="date" value={milestoneForm.completedDate||''} onChange={e => setMilestoneForm(f=>({...f,completedDate:e.target.value}))} style={inputStyle()}/>
              </Field>
            )}
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <Modal title={paymentEditing?'Edit Payment':'Add Payment'} onClose={() => setShowPayment(false)} width={480}
          footer={<><Btn variant="ghost" onClick={() => setShowPayment(false)}>Cancel</Btn><Btn onClick={handleSavePayment} disabled={paymentSaving}>{paymentSaving?'Saving…':paymentEditing?'Save':'Add'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {paymentErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{paymentErrors.api}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Amount (₹)" required error={paymentErrors.amount}>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f=>({...f,amount:e.target.value}))} placeholder="e.g. 50000" style={inputStyle(paymentErrors.amount)} autoFocus/>
              </Field>
              <Field label="Type">
                <select value={paymentForm.type} onChange={e => setPaymentForm(f=>({...f,type:e.target.value}))} style={inputStyle()}>
                  {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Date" required error={paymentErrors.date}>
                <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(f=>({...f,date:e.target.value}))} style={inputStyle(paymentErrors.date)}/>
              </Field>
              <Field label="Status">
                <select value={paymentForm.status} onChange={e => setPaymentForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  {PAYMENT_STATUSES.map(s => <option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <input value={paymentForm.notes} onChange={e => setPaymentForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Advance for Phase 1" style={inputStyle()}/>
            </Field>
          </div>
        </Modal>
      )}

      {/* Blocker Modal */}
      {showBlocker && (
        <Modal title="Add Blocker" onClose={() => setShowBlocker(false)} width={480}
          footer={<><Btn variant="ghost" onClick={() => setShowBlocker(false)}>Cancel</Btn><Btn variant="danger" onClick={handleAddBlocker} disabled={blockerSaving}>{blockerSaving?'Adding…':'Add Blocker'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {blockerErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{blockerErrors.api}</div>}
            <Field label="Blocker Type">
              <select value={blockerForm.type} onChange={e => setBlockerForm(f=>({...f,type:e.target.value}))} style={inputStyle()}>
                {BLOCKER_TYPES.map(t => <option key={t} value={t} style={{textTransform:'capitalize'}}>{t.replace('-',' ')}</option>)}
              </select>
            </Field>
            <Field label="Description" required error={blockerErrors.description}>
              <textarea value={blockerForm.description} onChange={e => setBlockerForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Describe the blocker and its impact…" style={{...inputStyle(blockerErrors.description), resize:'vertical'}} autoFocus/>
            </Field>
          </div>
        </Modal>
      )}

      {/* Achievement Modal */}
      {showAchievement && (
        <Modal title="Log a Win 🏆" onClose={() => setShowAchievement(false)} width={460}
          footer={<><Btn variant="ghost" onClick={() => setShowAchievement(false)}>Cancel</Btn><Btn onClick={handleAddAchievement} disabled={achievementSaving}>{achievementSaving?'Saving…':'Log Win'}</Btn></>}
        >
          <Field label="What did the team achieve?">
            <textarea value={achievementText} onChange={e => setAchievementText(e.target.value)} rows={3} placeholder="e.g. Client approved the design in first review, delivered 2 days ahead of schedule…" style={{...inputStyle(), resize:'vertical'}} autoFocus/>
          </Field>
        </Modal>
      )}

      {confirmDelMilestone   && <ConfirmModal message="Delete this milestone?"  onConfirm={handleDeleteMilestone}   onCancel={() => setConfirmDelMilestone(null)}/>}
      {confirmDelPayment     && <ConfirmModal message="Delete this payment?"    onConfirm={handleDeletePayment}     onCancel={() => setConfirmDelPayment(null)}/>}
      {confirmDelBlocker     && <ConfirmModal message="Delete this blocker?"    onConfirm={handleDeleteBlocker}     onCancel={() => setConfirmDelBlocker(null)}/>}
      {confirmDelAchievement && <ConfirmModal message="Delete this win entry?"  onConfirm={handleDeleteAchievement} onCancel={() => setConfirmDelAchievement(null)}/>}
    </div>
  );
}
