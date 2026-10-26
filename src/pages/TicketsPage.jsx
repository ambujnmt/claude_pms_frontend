import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Card, Badge, Btn, Modal, Field, inputStyle, ConfirmModal,
  PageHeader, EmptyState, Table, TR, TD,
} from '../components/UI';
import { Plus, Search, MessageSquare, CheckCircle2, RotateCcw, Trash2, Send } from 'lucide-react';
import { TICKET_MANAGER_ROLES } from '../context/AuthContext';
import ticketService, { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../services/ticketService';

const PRIORITY_COLOR = { low:'#2E6DB4', medium:'#8B5E0A', high:'#A85010', urgent:'#9B1C1C' };
const STATUS_COLOR   = { open:'#2E6DB4', in_progress:'#8B5E0A', resolved:'#1A6B3C', closed:'#6B7A99' };
const label = s => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const EMPTY = { title:'', category:'Bug / Issue', priority:'medium', projectId:'', description:'' };

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function TicketsPage() {
  const { user, users, projects } = useApp();
  const canManage = !!user && TICKET_MANAGER_ROLES.includes(user.role);   // ticket managers only (not every full-access role)

  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState('');
  const [search, setSearch]     = useState('');
  const [fStatus, setFStatus]   = useState('all');
  const [fPriority, setFPriority] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);

  const [showNew, setShowNew]   = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);

  const [openId, setOpenId]     = useState(null);       // ticket shown in the detail modal
  const [detail, setDetail]     = useState(null);
  const [edit, setEdit]         = useState({});         // manager controls
  const [note, setNote]         = useState('');
  const [comment, setComment]   = useState('');
  const [busy, setBusy]         = useState(false);
  const [detailErr, setDetailErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const load = async () => {
    setLoading(true); setLoadErr('');
    try { setTickets(await ticketService.getAll()); }
    catch { setLoadErr('Could not load tickets.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  /* ── detail ─────────────────────────────────────────── */
  const open = async (t) => {
    setOpenId(t.id); setDetail(t); setDetailErr(''); setComment('');
    setEdit({ status:t.status, priority:t.priority, assignedTo:t.assignedTo || '' });
    setNote(t.resolutionNote || '');
    try {
      const full = await ticketService.getById(t.id);
      setDetail(full);
    } catch { setDetailErr('Could not load ticket details.'); }
  };
  const close = () => { setOpenId(null); setDetail(null); setConfirmDel(false); };
  const applyUpdated = (t) => {
    setDetail(t);
    setEdit({ status:t.status, priority:t.priority, assignedTo:t.assignedTo || '' });
    setNote(t.resolutionNote || '');
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, ...t, comments: undefined } : x));
  };
  const errMsg = (err) => {
    const e = err.response?.data?.errors;
    return e ? Object.values(e).flat().join(' ') : (err.response?.data?.message || 'Action failed.');
  };

  const saveManager = async (overrides = {}) => {
    const next = { ...edit, ...overrides };
    if ((next.status === 'resolved' || next.status === 'closed') && !note.trim()) {
      setDetailErr('Add a resolution note before resolving or closing the ticket.');
      return;
    }
    setBusy(true); setDetailErr('');
    try {
      applyUpdated(await ticketService.update(detail.id, {
        status: next.status, priority: next.priority, assignedTo: next.assignedTo, resolutionNote: note,
      }));
    } catch (err) { setDetailErr(errMsg(err)); }
    finally { setBusy(false); }
  };

  const reopen = async () => {
    setBusy(true); setDetailErr('');
    try { applyUpdated(await ticketService.update(detail.id, { status:'open' })); }
    catch (err) { setDetailErr(errMsg(err)); }
    finally { setBusy(false); }
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    setBusy(true); setDetailErr('');
    try {
      const t = await ticketService.comment(detail.id, comment.trim());
      applyUpdated(t); setComment('');
    } catch (err) { setDetailErr(errMsg(err)); }
    finally { setBusy(false); }
  };

  const removeTicket = async () => {
    try {
      await ticketService.delete(detail.id);
      setTickets(prev => prev.filter(x => x.id !== detail.id));
      close();
    } catch (err) { setDetailErr(errMsg(err)); setConfirmDel(false); }
  };

  /* ── raise ──────────────────────────────────────────── */
  const raise = async () => {
    const e = {};
    if (!form.title.trim())       e.title = 'Required';
    if (!form.description.trim()) e.description = 'Please describe the issue';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const created = await ticketService.create(form);
      setTickets(prev => [created, ...prev]);
      setShowNew(false); setForm(EMPTY); setErrors({});
    } catch (err) { setErrors({ api: errMsg(err) }); }
    finally { setSaving(false); }
  };

  /* ── list ───────────────────────────────────────────── */
  const filtered = useMemo(() => tickets.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || (t.ticketNo || '').toLowerCase().includes(q) || (t.raiser?.name || '').toLowerCase().includes(q);
    const matchMine = !mineOnly || t.raisedBy === user?.id || t.assignedTo === user?.id;
    return matchQ && matchMine
      && (fStatus === 'all' || t.status === fStatus)
      && (fPriority === 'all' || t.priority === fPriority);
  }), [tickets, search, fStatus, fPriority, mineOnly, user]);

  const count = s => tickets.filter(t => t.status === s).length;
  const isRaiser = detail && detail.raisedBy === user?.id;
  const finished = detail && (detail.status === 'resolved' || detail.status === 'closed');

  return (
    <div className="fade-in">
      <PageHeader
        sub={canManage ? 'All tickets raised across the portal' : 'Raise an issue and track its resolution'}
        action={<Btn icon={<Plus size={14}/>} onClick={() => { setForm(EMPTY); setErrors({}); setShowNew(true); }}>Raise Ticket</Btn>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { l:'Open',        v:count('open'),        c:STATUS_COLOR.open },
          { l:'In Progress', v:count('in_progress'), c:STATUS_COLOR.in_progress },
          { l:'Resolved',    v:count('resolved'),    c:STATUS_COLOR.resolved },
          { l:'Total',       v:tickets.length,       c:'#1B2E6B' },
        ].map(k => (
          <Card key={k.l} style={{ padding:'14px 16px', borderTop:`3px solid ${k.c}` }}>
            <div style={{ fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{k.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 240px', maxWidth:340 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:11, color:'var(--text-muted)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket #, title, raised by…" style={{ ...inputStyle(), paddingLeft:32 }}/>
        </div>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ ...inputStyle(), width:'auto' }}>
          <option value="all">All statuses</option>
          {TICKET_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={fPriority} onChange={e => setFPriority(e.target.value)} style={{ ...inputStyle(), width:'auto' }}>
          <option value="all">All priorities</option>
          {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{label(p)}</option>)}
        </select>
        {canManage && (
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-dim)', cursor:'pointer' }}>
            <input type="checkbox" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)}/> Mine only
          </label>
        )}
      </div>

      <Card style={{ padding:0, overflow:'hidden' }}>
        {loading ? <div style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading tickets…</div>
        : loadErr ? <div style={{ padding:28, textAlign:'center', color:'var(--danger)', fontSize:14 }}>{loadErr} <span style={{ cursor:'pointer', textDecoration:'underline' }} onClick={load}>Retry</span></div>
        : filtered.length === 0 ? <EmptyState message={tickets.length ? 'No tickets match the filters.' : 'No tickets yet. Facing an issue? Raise one.'}/>
        : (
          <Table headers={['Ticket','Title','Priority','Status','Raised By','Assigned To','Created','']}>
            {filtered.map(t => (
              <TR key={t.id}>
                <TD><span style={{ fontWeight:700, color:'#2E6DB4', cursor:'pointer' }} onClick={() => open(t)}>{t.ticketNo}</span></TD>
                <TD>
                  <div style={{ fontWeight:600, cursor:'pointer' }} onClick={() => open(t)}>{t.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{t.category}{t.projectName ? ` · ${t.projectName}` : ''}</div>
                </TD>
                <TD><Badge label={label(t.priority)} color={PRIORITY_COLOR[t.priority]}/></TD>
                <TD><Badge label={label(t.status)} color={STATUS_COLOR[t.status]}/></TD>
                <TD>{t.raiser?.name || '—'}</TD>
                <TD>{t.assignee?.name || <span style={{ color:'var(--text-muted)' }}>Unassigned</span>}</TD>
                <TD><span style={{ color:'var(--text-muted)', fontSize:13 }}>{fmtDateTime(t.createdAt)}</span></TD>
                <TD>
                  <span onClick={() => open(t)} style={{ display:'inline-flex', alignItems:'center', gap:4, cursor:'pointer', color:'var(--text-muted)', fontSize:13 }}>
                    <MessageSquare size={13}/>{t.commentsCount ?? 0}
                  </span>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {/* ── Raise ticket ───────────────────────────────── */}
      {showNew && (
        <Modal title="Raise a Ticket" subtitle="Describe the issue you are facing" onClose={() => setShowNew(false)} width={560}
          footer={<><Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn><Btn onClick={raise} disabled={saving}>{saving ? 'Submitting…' : 'Submit Ticket'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{errors.api}</div>}
            <Field label="Title" required error={errors.title}>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} placeholder="Short summary of the issue" style={inputStyle(errors.title)} autoFocus maxLength={200}/>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Category">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))} style={inputStyle()}>
                  {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority:e.target.value }))} style={inputStyle()}>
                  {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{label(p)}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Related Project (optional)">
              <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId:e.target.value }))} style={inputStyle()}>
                <option value="">— None —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Description" required error={errors.description}>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} rows={5} placeholder="What happened? What did you expect? Steps to reproduce…" style={{ ...inputStyle(errors.description), resize:'vertical' }}/>
            </Field>
          </div>
        </Modal>
      )}

      {/* ── Ticket detail ──────────────────────────────── */}
      {openId && detail && (
        <Modal title={`${detail.ticketNo} · ${detail.title}`} subtitle={`${detail.category} · raised by ${detail.raiser?.name || '—'} on ${fmtDateTime(detail.createdAt)}`} onClose={close} width={760}
          footer={<>
            {canManage && <Btn variant="ghost" icon={<Trash2 size={13}/>} onClick={() => setConfirmDel(true)}>Delete</Btn>}
            <Btn variant="ghost" onClick={close}>Close</Btn>
          </>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {detailErr && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{detailErr}</div>}

            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Badge label={label(detail.status)} color={STATUS_COLOR[detail.status]}/>
              <Badge label={`${label(detail.priority)} priority`} color={PRIORITY_COLOR[detail.priority]}/>
              {detail.projectName && <Badge label={detail.projectName} color="#4C3A9E"/>}
              <Badge label={detail.assignee ? `Assigned: ${detail.assignee.name}` : 'Unassigned'} color="#6B7A99"/>
            </div>

            <div style={{ padding:'12px 14px', borderRadius:8, background:'var(--bg-elevated)', fontSize:14, whiteSpace:'pre-wrap', lineHeight:1.55 }}>{detail.description}</div>

            {finished && detail.resolutionNote && (
              <div style={{ padding:'12px 14px', borderRadius:8, background:'#EDF7F2', border:'1px solid #1A6B3C30', fontSize:14 }}>
                <div style={{ fontWeight:700, color:'#1A6B3C', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                  <CheckCircle2 size={14}/> {label(detail.status)}{detail.resolver ? ` by ${detail.resolver.name}` : ''}{detail.resolvedAt ? ` · ${fmtDateTime(detail.resolvedAt)}` : ''}
                </div>
                <div style={{ whiteSpace:'pre-wrap' }}>{detail.resolutionNote}</div>
              </div>
            )}

            {/* Manager / authorised controls */}
            {canManage && (
              <Card style={{ padding:14, background:'var(--bg-elevated)' }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:10, color:'#1B2E6B' }}>Manage ticket</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                  <Field label="Status">
                    <select value={edit.status} onChange={e => setEdit(s => ({ ...s, status:e.target.value }))} style={inputStyle()}>
                      {TICKET_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select value={edit.priority} onChange={e => setEdit(s => ({ ...s, priority:e.target.value }))} style={inputStyle()}>
                      {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{label(p)}</option>)}
                    </select>
                  </Field>
                  <Field label="Assign to">
                    <select value={edit.assignedTo} onChange={e => setEdit(s => ({ ...s, assignedTo:e.target.value }))} style={inputStyle()}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Resolution note (required to resolve / close)">
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="What was done to fix it?" style={{ ...inputStyle(), resize:'vertical' }}/>
                </Field>
                <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                  <Btn onClick={() => saveManager()} disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</Btn>
                  {!finished && <Btn variant="ghost" icon={<CheckCircle2 size={13}/>} onClick={() => { setEdit(s => ({ ...s, status:'resolved' })); saveManager({ status:'resolved' }); }} disabled={busy}>Mark Resolved</Btn>}
                  {finished && <Btn variant="ghost" icon={<RotateCcw size={13}/>} onClick={() => { setEdit(s => ({ ...s, status:'open' })); saveManager({ status:'open' }); }} disabled={busy}>Re-open</Btn>}
                </div>
              </Card>
            )}

            {/* Raiser (non-manager) can re-open a finished ticket */}
            {!canManage && isRaiser && finished && (
              <div><Btn variant="ghost" icon={<RotateCcw size={13}/>} onClick={reopen} disabled={busy}>Not fixed? Re-open ticket</Btn></div>
            )}

            {/* Activity + comments */}
            <div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8, color:'#1B2E6B' }}>Activity</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:240, overflowY:'auto', marginBottom:10 }}>
                {(detail.comments || []).length === 0 && <div style={{ fontSize:13, color:'var(--text-muted)' }}>No activity yet.</div>}
                {(detail.comments || []).map(c => c.kind === 'status' ? (
                  <div key={c.id} style={{ fontSize:12.5, color:'var(--text-muted)', textAlign:'center' }}>
                    {c.user?.name} · {c.body} · {fmtDateTime(c.createdAt)}
                  </div>
                ) : (
                  <div key={c.id} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background: c.user?.id === user?.id ? '#EDF4FB' : 'var(--bg-card)' }}>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}><strong style={{ color:'var(--text)' }}>{c.user?.name}</strong> · {fmtDateTime(c.createdAt)}</div>
                    <div style={{ fontSize:14, whiteSpace:'pre-wrap' }}>{c.body}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }} placeholder="Write a comment…" style={{ ...inputStyle(), flex:1 }}/>
                <Btn icon={<Send size={13}/>} onClick={sendComment} disabled={busy || !comment.trim()}>Send</Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Delete this ticket permanently?" onConfirm={removeTicket} onCancel={() => setConfirmDel(false)}/>}
    </div>
  );
}
