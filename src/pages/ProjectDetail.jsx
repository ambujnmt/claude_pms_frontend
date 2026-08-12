import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, ProgressBar, Badge, formatCurrency, formatDate, Btn, Modal, Field, inputStyle, ConfirmModal, SectionTitle, EmptyState, Table, TR, TD, ActionMenu } from '../components/UI';
import { ArrowLeft, FileText, Link, File, Lock, Users, Calendar, DollarSign, Target, Plus, Trash2 } from 'lucide-react';
import { resources, getUserById } from '../data/mockData';

const TABS = ['Overview', 'Milestones', 'Documents', 'Payments', 'Blockers & Wins'];

export default function ProjectDetail() { const { id } = useParams();
  const navigate = useNavigate();
  const { projects, clients, isManagement, isPM, isBD, toggleMilestoneCycleTarget, addMilestone, updateMilestone, deleteMilestone, addPayment, updatePayment, deletePayment, addBlocker, resolveBlocker, deleteBlocker, addAchievement, deleteAchievement, user } = useApp();
  const project = projects.find(p => p.id === id);
  const [tab, setTab]   = useState('Overview');
  const [confirmDel, setConfirmDel] = useState(null); // { type, id }

  // Milestone form
  const [mModal, setMModal] = useState(false);
  const [mForm, setMForm] = useState({ name: '', dueDate: '' });
  const [mEditing, setMEditing] = useState(null);

  // Payment form
  const [pModal, setPModal] = useState(false);
  const [pForm, setPForm] = useState({ amount: '', type: 'Milestone', date: '', notes: '', status: 'upcoming' });
  const [pEditing, setPEditing] = useState(null);

  // Blocker / Achievement forms
  const [bForm, setBForm] = useState({ type: 'communication', description: '' });
  const [showBForm, setShowBForm] = useState(false);
  const [aForm, setAForm] = useState({ description: '' });
  const [showAForm, setShowAForm] = useState(false);

  if (!project) return <div style={{ padding: 32 }}>Not found. <button onClick={() => navigate('/projects')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button></div>;

  const client      = clients.find(c => c.id === project.clientId);
  const projectRsrc = project.resources.map(rid => resources.find(r => r.id === rid)).filter(Boolean);
  const pm  = getUserById(project.pmOwner);
  const bd  = getUserById(project.bdOwner);
  const totalPaid = project.payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);

  // Milestone save
  const saveMilestone = () => { if (!mForm.name.trim()) return;
    mEditing ? updateMilestone(id, mEditing, mForm) : addMilestone(id, mForm);
    setMModal(false); setMEditing(null); setMForm({ name: '', dueDate: '' });
  };
  const openEditM = (m) => { setMForm({ name: m.name, dueDate: m.dueDate }); setMEditing(m.id); setMModal(true); };

  // Payment save
  const savePayment = () => { if (!pForm.amount || !pForm.date) return;
    pEditing ? updatePayment(id, pEditing, pForm) : addPayment(id, pForm);
    setPModal(false); setPEditing(null); setPForm({ amount: '', type: 'Milestone', date: '', notes: '', status: 'upcoming' });
  };
  const openEditP = (p) => { setPForm({ amount: p.amount, type: p.type, date: p.date, notes: p.notes, status: p.status }); setPEditing(p.id); setPModal(true); };

  const handleConfirm = () => { if (!confirmDel) return;
    if (confirmDel.type === 'milestone') deleteMilestone(id, confirmDel.id);
    if (confirmDel.type === 'payment')   deletePayment(id, confirmDel.id);
    if (confirmDel.type === 'blocker')   deleteBlocker(id, confirmDel.id);
    if (confirmDel.type === 'achievement') deleteAchievement(id, confirmDel.id);
    setConfirmDel(null);
  };

  const catColor = { Website: 'var(--accent)', 'Mobile App': 'var(--violet)', 'AI/ML': 'var(--orange)' };

  return (
    <div className="fade-in">
      <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontWeight: 700, marginBottom: 14 }}>
        <ArrowLeft size={13} /> Back to Projects
      </button>

      {/* Header card */}
      <Card style={{ marginBottom: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 4, height: 54, borderRadius: 4, background: project.color, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700 }}>{project.name}</h1>
                <StatusBadge status={project.status} />
                <Badge label={project.category} color={catColor[project.category]} />
              </div>
              {client
                ? <div style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Client: </span>
                    <span onClick={() => navigate(`/clients/${client.id}`)} style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>{project.client}</span>
                  </div>
                : <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>{project.client}</div>
              }
              <div style={{ fontSize: 14, color: 'var(--text-dim)', maxWidth: 560, lineHeight: 1.7 }}>{project.description}</div>
              {project.clientCommitment && (
                <div style={{ marginTop: 10, padding: '7px 12px', borderRadius: 8, background: 'var(--warning-dim)', border: '1px solid #92520A25', maxWidth: 560 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>Client Commitment</div>
                  <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>{project.clientCommitment}</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontStyle: 'italic', fontWeight: 700, color: project.color, textAlign: 'right' }}>{project.completion}%</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 6, fontWeight: 700 }}>Completion</div>
            <ProgressBar value={project.completion} color={project.color} height={6} bg="var(--bg-elevated)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>{formatDate(project.startDate)}</span><span>{formatDate(project.endDate)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap', fontSize: 14 }}>
          {[
            { label: 'Budget', val: formatCurrency(project.budget), color: 'var(--text)' }, ...(isManagement ? [{ label: 'Received', val: formatCurrency(totalPaid), color: 'var(--success)' }] : []), { label: 'PM', val: pm?.name || '—', color: 'var(--text)' }, { label: 'BD', val: bd?.name || '—', color: 'var(--text)' }, { label: 'Milestones', val: `${project.milestones.filter(m => m.status==='completed').length}/${project.milestones.length}`, color: 'var(--text)' }, ].map(s => (
            <div key={s.label} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
              <span style={{ fontWeight: 700, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 13px', borderRadius: 7, border: 'none', background: tab===t?'var(--accent)':'transparent', color: tab===t?'#fff':'var(--text-muted)', fontSize: 14, fontWeight: tab===t?700:400, cursor: 'pointer', transition: 'all 0.13s' }}>{t}</button>)}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card>
            <SectionTitle sub="Status breakdown">Milestone Summary</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['completed','Completed','var(--success)'],['in-progress','In Progress','var(--violet)'],['overdue','Overdue','var(--danger)'],['upcoming','Upcoming','var(--text-muted)']].map(([s,l,c]) => (
                <div key={s} style={{ padding: 12, borderRadius: 8, background: `${c}08`, border: `1px solid ${c}20`, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', fontWeight: 700, color: c }}>{project.milestones.filter(m=>m.status===s).length}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Assigned developers">Team</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {projectRsrc.map(r => { const col = r.utilization>85?'var(--danger)':r.utilization>70?'var(--warning)':'var(--success)';
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{r.avatar}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div><div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{r.tech}</div></div>
                    <Badge label={`${r.utilization}%`} color={col} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── MILESTONES ── */}
      {tab === 'Milestones' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle sub="Project milestones">Timeline</SectionTitle>
            {isPM && <Btn size="sm" icon={<Plus size={12} />} onClick={() => { setMForm({ name:'', dueDate:'' }); setMEditing(null); setMModal(true); }}>Add Milestone</Btn>}
          </div>
          <Table headers={['Milestone', 'Due Date', 'Completed', 'Status', 'Cycle Target', 'Actions']}>
            {project.milestones.map(m => { const pay = m.linkedPaymentId ? project.payments.find(p => p.id === m.linkedPaymentId) : null;
              return (
                <TR key={m.id}>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 18, borderRadius: 3, background: project.color }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.name}</div>
                        {pay && <div style={{ fontSize: 14, color: 'var(--warning)' }}>Linked: {formatCurrency(pay.amount)} · {pay.status}</div>}
                      </div>
                    </div>
                  </TD>
                  <TD><span style={{ fontSize: 14, color: m.status==='overdue'?'var(--danger)':'var(--text-muted)' }}>{formatDate(m.dueDate)}</span></TD>
                  <TD><span style={{ fontSize: 14, color: 'var(--success)' }}>{m.completedDate ? formatDate(m.completedDate) : '—'}</span></TD>
                  <TD><StatusBadge status={m.status} /></TD>
                  <TD>
                    {m.status !== 'completed' && isPM
                      ? <button onClick={() => toggleMilestoneCycleTarget(id, m.id)} style={{ padding: '3px 9px', borderRadius: 6, border: `1px solid ${m.cycleTargeted?'var(--accent)':'var(--border)'}`, background: m.cycleTargeted?'var(--accent-dim)':'transparent', color: m.cycleTargeted?'var(--accent)':'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Target size={9} />{m.cycleTargeted ? 'Targeted' : 'Set'}</button>
                      : m.cycleTargeted ? <Badge label="Targeted" color="var(--accent)" /> : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>—</span>
                    }
                  </TD>
                  <TD>
                    {isPM && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEditM(m)} style={{ padding: '3px 8px', fontSize: 14, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>Edit</button>
                        <button onClick={() => setConfirmDel({ type: 'milestone', id: m.id })} style={{ padding: '3px 8px', fontSize: 14, borderRadius: 5, border: '1px solid #A01C1C25', background: '#A01C1C08', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700 }}>Del</button>
                      </div>
                    )}
                  </TD>
                </TR>
              );
            })}
          </Table>
        </Card>
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'Documents' && (
        <Card>
          <SectionTitle sub="Project files and references">Documents</SectionTitle>
          {!project.documents.length && <EmptyState message="No documents uploaded yet." />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {project.documents.map(d => { const iconMap = { pdf: { icon: <FileText size={14} />, color: 'var(--danger)' }, link: { icon: <Link size={14} />, color: 'var(--accent)' }, docx: { icon: <File size={14} />, color: 'var(--violet)' }, xlsx: { icon: <File size={14} />, color: 'var(--success)' }, contract: { icon: <FileText size={14} />, color: 'var(--warning)' } };
              const { icon, color } = iconMap[d.type] || { icon: <File size={14} />, color: 'var(--text-muted)' };
              const uploader = getUserById(d.uploadedBy);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div style={{ color }}>{icon}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div><div style={{ fontSize: 14, color: 'var(--text-muted)' }}>By {uploader?.name} · {formatDate(d.uploadedAt)}{d.size ? ` · ${d.size}` : ''}</div></div>
                  <Badge label={d.type.toUpperCase()} color={color} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── PAYMENTS ── */}
      {tab === 'Payments' && (
        isManagement ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Budget', val: formatCurrency(project.budget), color: 'var(--text)' }, { label: 'Received', val: formatCurrency(totalPaid), color: 'var(--success)' }, { label: 'Pending / Due', val: formatCurrency(project.payments.filter(p=>p.status!=='received').reduce((s,p)=>s+p.amount,0)), color: 'var(--warning)' }, ].map(s => (
                <Card key={s.label} style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                </Card>
              ))}
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle sub="Full payment history">Payment Ledger</SectionTitle>
                <Btn size="sm" icon={<Plus size={12} />} onClick={() => { setPForm({ amount:'', type:'Milestone', date:'', notes:'', status:'upcoming' }); setPEditing(null); setPModal(true); }}>Add Payment</Btn>
              </div>
              <Table headers={['Type', 'Notes', 'Date', 'Amount', 'Status', 'Actions']}>
                {project.payments.map(pay => (
                  <TR key={pay.id}>
                    <TD><span style={{ fontWeight: 700 }}>{pay.type}</span></TD>
                    <TD><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{pay.notes}</span></TD>
                    <TD><span style={{ fontSize: 14 }}>{formatDate(pay.date)}</span></TD>
                    <TD><span style={{ fontWeight: 800 }}>{formatCurrency(pay.amount)}</span></TD>
                    <TD><StatusBadge status={pay.status} /></TD>
                    <TD><ActionMenu onEdit={() => openEditP(pay)} onDelete={() => setConfirmDel({ type:'payment', id: pay.id })} /></TD>
                  </TR>
                ))}
              </Table>
            </Card>
          </div>
        ) : (
          <Card style={{ padding: 40, textAlign: 'center' }}>
            <Lock size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Payment details visible to management only.</div>
          </Card>
        )
      )}

      {/* ── BLOCKERS & WINS ── */}
      {tab === 'Blockers & Wins' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Blockers */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <SectionTitle>⚠ Blockers</SectionTitle>
              {(isPM || isBD) && <Btn size="sm" variant="ghost" icon={<Plus size={12} />} onClick={() => setShowBForm(!showBForm)}>Add</Btn>}
            </div>
            {showBForm && (
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 12 }}>
                <select value={bForm.type} onChange={e => setBForm(f => ({...f, type: e.target.value}))} style={{ ...inputStyle(), marginBottom: 8 }}>
                  {['communication','dispute','compliance','technical','other'].map(t => <option key={t}>{t}</option>)}
                </select>
                <textarea value={bForm.description} onChange={e => setBForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Describe the blocker…" style={{ ...inputStyle(), resize: 'vertical', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn size="sm" variant="danger" onClick={() => { if (bForm.description.trim()) { addBlocker(id, { ...bForm, addedBy: user.id }); setBForm({ type:'communication', description:'' }); setShowBForm(false); } }}>Add</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setShowBForm(false)}>Cancel</Btn>
                </div>
              </div>
            )}
            {!project.blockers.length && <EmptyState icon="✅" message="No blockers — smooth sailing!" />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {project.blockers.map(b => { const adder = getUserById(b.addedBy);
                return (
                  <div key={b.id} style={{ padding: '10px 12px', borderRadius: 8, background: b.resolved ? 'var(--success-dim)' : 'var(--danger-dim)', border: `1px solid ${b.resolved ? 'var(--success)' : 'var(--danger)'}20`, opacity: b.resolved ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: b.resolved ? 'var(--success)' : 'var(--danger)' }}>{b.type}{b.resolved ? ' · Resolved' : ''}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!b.resolved && isManagement && <button onClick={() => resolveBlocker(id, b.id)} style={{ fontSize: 14, padding: '1px 7px', borderRadius: 4, background: 'var(--success-dim)', border: '1px solid #1A6B3C30', color: 'var(--success)', cursor: 'pointer', fontWeight: 700 }}>Resolve</button>}
                        <button onClick={() => setConfirmDel({ type: 'blocker', id: b.id })} style={{ fontSize: 14, padding: '1px 7px', borderRadius: 4, background: 'var(--danger-dim)', border: '1px solid #A01C1C25', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700 }}>Del</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{b.description}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>Added by {adder?.name} · {formatDate(b.addedAt)}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Achievements */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <SectionTitle>🏆 Achievements</SectionTitle>
              {(isPM || isManagement) && <Btn size="sm" variant="ghost" icon={<Plus size={12} />} onClick={() => setShowAForm(!showAForm)}>Add</Btn>}
            </div>
            {showAForm && (
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 12 }}>
                <textarea value={aForm.description} onChange={e => setAForm({ description: e.target.value })} rows={2} placeholder="Describe the win…" style={{ ...inputStyle(), resize: 'vertical', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn size="sm" onClick={() => { if (aForm.description.trim()) { addAchievement(id, { ...aForm, addedBy: user.id }); setAForm({ description:'' }); setShowAForm(false); } }}>Add</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setShowAForm(false)}>Cancel</Btn>
                </div>
              </div>
            )}
            {!project.achievements.length && <EmptyState icon="🎯" message="No achievements logged yet." />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {project.achievements.map(a => { const adder = getUserById(a.addedBy);
                return (
                  <div key={a.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--warning-dim)', border: '1px solid #92520A20' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span />
                      <button onClick={() => setConfirmDel({ type: 'achievement', id: a.id })} style={{ fontSize: 14, padding: '1px 7px', borderRadius: 4, background: 'var(--danger-dim)', border: '1px solid #A01C1C25', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700 }}>Del</button>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{a.description}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>Added by {adder?.name} · {formatDate(a.addedAt)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Milestone Modal */}
      {mModal && (
        <Modal title={mEditing ? 'Edit Milestone' : 'Add Milestone'} onClose={() => setMModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setMModal(false)}>Cancel</Btn><Btn onClick={saveMilestone}>{mEditing ? 'Save' : 'Add'}</Btn></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Milestone Name" required><input value={mForm.name} onChange={e => setMForm(f=>({...f,name:e.target.value}))} style={inputStyle()} /></Field>
            <Field label="Due Date"><input type="date" value={mForm.dueDate} onChange={e => setMForm(f=>({...f,dueDate:e.target.value}))} style={inputStyle()} /></Field>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {pModal && (
        <Modal title={pEditing ? 'Edit Payment' : 'Add Payment'} onClose={() => setPModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setPModal(false)}>Cancel</Btn><Btn onClick={savePayment}>{pEditing ? 'Save' : 'Add'}</Btn></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Amount (₹)" required><input type="number" value={pForm.amount} onChange={e => setPForm(f=>({...f,amount:e.target.value}))} style={inputStyle()} /></Field>
              <Field label="Type">
                <select value={pForm.type} onChange={e => setPForm(f=>({...f,type:e.target.value}))} style={inputStyle()}>
                  {['Advance','Milestone','Final'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Date" required><input type="date" value={pForm.date} onChange={e => setPForm(f=>({...f,date:e.target.value}))} style={inputStyle()} /></Field>
              <Field label="Status">
                <select value={pForm.status} onChange={e => setPForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  {['upcoming','pending','received'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes"><input value={pForm.notes} onChange={e => setPForm(f=>({...f,notes:e.target.value}))} style={inputStyle()} /></Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message={`Delete this ${confirmDel.type}?`} onConfirm={handleConfirm} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}
