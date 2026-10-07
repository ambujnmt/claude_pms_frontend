import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, StatusBadge, Badge, Btn, Modal, Field, inputStyle, ConfirmModal,
  formatDate, EmptyState, SectionTitle, formatAmount, calcRenewalDate,
} from '../components/UI';
import UserMultiSelect from '../components/UserMultiSelect';
import { ArrowLeft, Edit2, Trash2, CalendarClock, FileText, Wrench } from 'lucide-react';
import clientServiceApi from '../services/clientServiceApi';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Wrench },
  { key: 'schedule', label: 'Billing & Reports', icon: CalendarClock },
  { key: 'notes',    label: 'Notes', icon: FileText },
];

const CONTRACT_TYPES  = ['Development Maintenance','SEO','PPC Management','Social Media','Hosting & Support','Content Marketing','UI/UX Retainer','AI/ML Maintenance','Other'];
const BILLING_CYCLES  = ['monthly','quarterly','annual'];
const PAYMENT_METHODS = ['Bank Transfer','PayPal','Stripe','Credit Card','Wire Transfer','Cheque','Other'];
const BD_ROLES        = ['bd','management','super_admin'];
const CYCLE_MONTHS    = { monthly: 1, quarterly: 3, annual: 12 };
const TYPE_COLOR = {
  'SEO':'#1A6B3C','PPC Management':'#8B5E0A','Social Media':'#9B1C1C','Development Maintenance':'#1B2E6B',
  'Hosting & Support':'#2E6DB4','Content Marketing':'#4C3A9E','UI/UX Retainer':'#4A90D9','AI/ML Maintenance':'#A85010','Other':'#6B7A99',
};

/* ── date helpers (work on YYYY-MM-DD strings, no timezone drift) ── */
const pad = (n) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12), nm = total % 12;
  const last = new Date(ny, nm + 1, 0).getDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, last))}`;
}
function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number), [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
// Next billing dates on/after today, stepping from the start date by one billing cycle
function upcomingBillingDates(start, cycle, count = 6) {
  if (!start) return [];
  const step = CYCLE_MONTHS[cycle] || 1, today = todayStr(), out = [];
  for (let k = 0; out.length < count && k < 600; k++) {
    const d = addMonths(start, k * step);
    if (d >= today) out.push(d);
  }
  return out;
}
// Next monthly report dates (reportingDay of each month, clamped to month end)
function upcomingReportDates(day, count = 6) {
  if (!day) return [];
  const today = todayStr(), now = new Date(), out = [];
  for (let k = 0; out.length < count && k < 30; k++) {
    const y = now.getFullYear(), m = now.getMonth() + k;
    const ny = y + Math.floor(m / 12), nm = ((m % 12) + 12) % 12;
    const last = new Date(ny, nm + 1, 0).getDate();
    const d = `${ny}-${pad(nm + 1)}-${pad(Math.min(day, last))}`;
    if (d >= today) out.push(d);
  }
  return out;
}
const ordinal = (n) => { n = parseInt(n); if (n % 10 === 1 && n !== 11) return 'st'; if (n % 10 === 2 && n !== 12) return 'nd'; if (n % 10 === 3 && n !== 13) return 'rd'; return 'th'; };
const initials = (u) => u.avatar || (u.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientServices, setClientServices, clients, users, currencies, activeCurrency, isManagement, isBD } = useApp();

  const [svc, setSvc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDel, setConfirmDel] = useState(false);

  const numId = parseInt(id) || id;
  const canEdit = isManagement || isBD;

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        let found = clientServices.find(c => c.id === numId || c.id === id);
        if (!found) found = await clientServiceApi.getById(id);
        setSvc(found);
      } catch { setError('Contract not found or failed to load.'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const client = svc ? clients.find(c => c.id === svc.clientId || c.id === parseInt(svc.clientId)) : null;
  const currency = svc?.currency || activeCurrency;
  const resources = svc ? (svc.resources || users.filter(u => (svc.resourceIds || []).includes(u.id))) : [];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyUpdate = (updated) => {
    setSvc(updated);
    setClientServices(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const openEdit = () => {
    setForm({
      clientId: svc.clientId, bdOwner: svc.bdOwner || '', resources: svc.resourceIds || [],
      serviceId: svc.serviceId || '', name: svc.name || '', contractType: svc.contractType || 'Other',
      monthlyAmount: svc.monthlyAmount ?? '', currencyId: svc.currencyId || '', billingCycle: svc.billingCycle || 'monthly',
      paymentMethod: svc.paymentMethod || '', status: svc.status || 'active', startDate: svc.startDate || '',
      renewalDate: svc.renewalDate || '', reportingDay: svc.reportingDay || '', notes: svc.notes || '',
    });
    setErrors({}); setShowEdit(true);
  };

  const handleSave = async () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Required';
    if (!form.monthlyAmount) e.monthlyAmount = 'Required';
    if (!form.startDate) e.startDate = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      applyUpdate(await clientServiceApi.update(svc.id, { ...form, clientId: parseInt(form.clientId) }));
      setShowEdit(false);
    } catch { setErrors({ api: 'Failed to save. Please try again.' }); }
    finally { setSaving(false); }
  };

  const quickStatus = async (status) => {
    try {
      applyUpdate(await clientServiceApi.update(svc.id, {
        ...svc, status, clientId: svc.clientId, bdOwner: svc.bdOwner, resources: svc.resourceIds || [],
      }));
    } catch { alert('Failed to update status.'); }
  };

  const handleDelete = async () => {
    try {
      await clientServiceApi.delete(svc.id);
      setClientServices(prev => prev.filter(c => c.id !== svc.id));
      navigate('/maintenance');
    } catch { alert('Failed to delete contract.'); setConfirmDel(false); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, color:'var(--text-muted)', fontSize:14 }}>Loading contract…</div>;
  if (error || !svc) return (
    <div style={{ textAlign:'center', padding:40 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
      <div style={{ fontSize:16, color:'var(--text-muted)', marginBottom:20 }}>{error || 'Contract not found.'}</div>
      <Btn onClick={() => navigate('/maintenance')}>← Back to Maintenance</Btn>
    </div>
  );

  const tcolor = TYPE_COLOR[svc.contractType] || '#2E6DB4';
  const today = todayStr();
  const months = CYCLE_MONTHS[svc.billingCycle] || 1;
  const perCycle = (svc.monthlyAmount || 0) * months;
  const renewalIn = svc.renewalDate ? daysBetween(today, svc.renewalDate) : null;
  const activeMonths = svc.startDate && svc.startDate <= today
    ? Math.max(0, Math.floor(daysBetween(svc.startDate, today) / 30.4375)) : 0;
  const billingDates = upcomingBillingDates(svc.startDate, svc.billingCycle);
  const reportDates = upcomingReportDates(svc.reportingDay);
  const nextReport = reportDates[0];
  const daysTo = (d) => { const n = daysBetween(today, d); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`; };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/maintenance')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <ArrowLeft size={13}/> Maintenance
          </button>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:14, height:14, borderRadius:3, background:tcolor }}/>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'#1B2E6B', letterSpacing:'-0.5px', lineHeight:1.2 }}>{svc.name}</h1>
              <StatusBadge status={svc.status}/>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:5, alignItems:'center' }}>
              {client && <span onClick={() => navigate(`/clients/${client.id}`)} style={{ fontSize:13, color:'#2E6DB4', fontWeight:600, cursor:'pointer' }}>{client.name}</span>}
              <Badge label={svc.contractType || 'Other'} color={tcolor}/>
              {svc.renewalDate && <span style={{ fontSize:12, color:'var(--text-muted)' }}>Renews {formatDate(svc.renewalDate)}</span>}
            </div>
          </div>
        </div>
        {canEdit && (
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" icon={<Trash2 size={13}/>} onClick={() => setConfirmDel(true)}>Delete</Btn>
            <Btn icon={<Edit2 size={13}/>} onClick={openEdit}>Edit Contract</Btn>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Monthly Amount', value:formatAmount(svc.monthlyAmount, currency), color:'var(--success)' },
          { label:`Per ${svc.billingCycle === 'annual' ? 'year' : svc.billingCycle === 'quarterly' ? 'quarter' : 'month'} billed`, value:formatAmount(perCycle, currency), color:'#1B2E6B' },
          { label:'Next Renewal', value: renewalIn === null ? '—' : renewalIn < 0 ? `${-renewalIn}d overdue` : renewalIn === 0 ? 'Today' : `${renewalIn} days`, color: renewalIn !== null && renewalIn < 0 ? 'var(--danger)' : renewalIn !== null && renewalIn <= 7 ? 'var(--warning)' : '#2E6DB4' },
          { label:'Next Report', value: nextReport ? formatDate(nextReport) : '—', color:'#4C3A9E' },
          { label:'Months Active', value:activeMonths, color:'#1A6B3C' },
        ].map(k => (
          <Card key={k.label} style={{ padding:'12px 14px', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:20, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Status quick actions */}
      {canEdit && (
        <Card style={{ padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Contract status</span>
          <div style={{ display:'flex', gap:6 }}>
            {['active','paused','cancelled'].map(s => (
              <Btn key={s} size="sm" variant={svc.status === s ? 'primary' : 'ghost'} onClick={() => svc.status !== s && quickStatus(s)} style={{ textTransform:'capitalize' }}>{s}</Btn>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:7, border:'none', cursor:'pointer', background:tab===key?'#1B2E6B':'transparent', color:tab===key?'#fff':'var(--text-muted)', fontSize:13, fontWeight:tab===key?700:400, fontFamily:'var(--font-body)' }}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card>
            <SectionTitle>Contract Details</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Client', value: client?.name, link: client ? () => navigate(`/clients/${client.id}`) : null },
                { label:'Contract Type', value: svc.contractType },
                { label:'Service', value: svc.serviceType ? `${svc.serviceType.icon || ''} ${svc.serviceType.name}`.trim() : null },
                { label:'Monthly Amount', value: `${formatAmount(svc.monthlyAmount, currency)} ${currency?.code || ''}` },
                { label:'Billing Cycle', value: svc.billingCycle, cap: true },
                { label:'Payment Method', value: svc.paymentMethod },
                { label:'Start Date', value: formatDate(svc.startDate) },
                { label:'Renewal Date', value: svc.renewalDate ? formatDate(svc.renewalDate) : null },
                { label:'Monthly Reporting', value: svc.reportingDay ? `${svc.reportingDay}${ordinal(svc.reportingDay)} of every month` : null },
                { label:'BD Owner', value: svc.bdOwnerName },
              ].filter(r => r.value && r.value !== '—').map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:14, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{row.label}</span>
                  <span onClick={row.link || undefined} style={{ color:row.link?'#2E6DB4':'var(--text)', fontWeight:row.link?700:400, cursor:row.link?'pointer':'default', textTransform:row.cap?'capitalize':'none' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Card>
              <SectionTitle>Team</SectionTitle>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>BD Owner</div>
              <div style={{ fontSize:14, marginBottom:14 }}>{svc.bdOwnerName || <span style={{ color:'var(--text-muted)' }}>Unassigned</span>}</div>
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
                )}
            </Card>
            {svc.notes && (
              <Card>
                <SectionTitle>Scope / Notes</SectionTitle>
                <p style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{svc.notes}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* BILLING & REPORTS */}
      {tab === 'schedule' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card>
            <SectionTitle sub={`${svc.billingCycle} billing from ${formatDate(svc.startDate)}`}>Upcoming Billing</SectionTitle>
            {billingDates.length === 0 ? <EmptyState icon="💳" message="No start date set."/> : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {billingDates.map((d, i) => (
                  <div key={d} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', borderRadius:8, background:'var(--bg-elevated)', fontSize:13 }}>
                    <span style={{ fontWeight:600 }}>{formatDate(d)} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>· {daysTo(d)}</span></span>
                    <strong style={{ color:'var(--success)' }}>{formatAmount(perCycle, currency)}</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle sub={svc.reportingDay ? `Due on the ${svc.reportingDay}${ordinal(svc.reportingDay)} of every month` : undefined}>Upcoming Reports</SectionTitle>
            {reportDates.length === 0 ? <EmptyState icon="📊" message="No reporting day set for this contract."/> : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {reportDates.map(d => (
                  <div key={d} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'var(--bg-elevated)', fontSize:13 }}>
                    <span style={{ fontWeight:600 }}>{formatDate(d)}</span>
                    <span style={{ color:'var(--text-muted)' }}>{daysTo(d)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* NOTES */}
      {tab === 'notes' && (
        <Card>
          <SectionTitle>Scope / Notes</SectionTitle>
          {svc.notes ? <p style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{svc.notes}</p> : <EmptyState icon="📝" message="No notes added yet."/>}
        </Card>
      )}

      {/* Edit modal */}
      {showEdit && (
        <Modal title="Edit Maintenance Contract" subtitle="Recurring service agreement or retainer" onClose={() => setShowEdit(false)} width={600}
          footer={<><Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14 }}>{errors.api}</div>}
            <Field label="Contract / Service Name" required error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle(errors.name)}/>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Contract Type">
                <select value={form.contractType} onChange={e => set('contractType', e.target.value)} style={inputStyle()}>
                  {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle()}>
                  {['active','paused','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Monthly Amount" required error={errors.monthlyAmount}>
                <input type="number" value={form.monthlyAmount} onChange={e => set('monthlyAmount', e.target.value)} style={inputStyle(errors.monthlyAmount)}/>
              </Field>
              <Field label="Currency">
                <select value={form.currencyId} onChange={e => set('currencyId', e.target.value)} style={inputStyle()}>
                  <option value="">Default ({activeCurrency?.code})</option>
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                </select>
              </Field>
              <Field label="Billing Cycle">
                <select value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value, renewalDate: f.startDate ? calcRenewalDate(f.startDate, e.target.value) : f.renewalDate }))} style={inputStyle()}>
                  {BILLING_CYCLES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Start Date" required error={errors.startDate}>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value, renewalDate: calcRenewalDate(e.target.value, f.billingCycle) }))} style={inputStyle(errors.startDate)}/>
              </Field>
              <Field label="Renewal Date (auto)">
                <input type="date" value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} style={inputStyle()}/>
              </Field>
              <Field label="Monthly Reporting Day">
                <input type="number" min={1} max={31} value={form.reportingDay} onChange={e => set('reportingDay', e.target.value)} style={inputStyle()}/>
              </Field>
            </div>
            <Field label="Payment Method">
              <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} style={inputStyle()}>
                <option value="">Select…</option>
                {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="BD Owner">
              <select value={form.bdOwner} onChange={e => set('bdOwner', e.target.value)} style={inputStyle()}>
                <option value="">Unassigned</option>
                {users.filter(u => BD_ROLES.includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Resources (developers, designers, SEO, QA, etc.)">
              <UserMultiSelect users={users} value={form.resources || []} onChange={v => set('resources', v)} placeholder="Search team members to assign…"/>
            </Field>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...inputStyle(), resize:'vertical' }}/>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Delete this maintenance contract?" onConfirm={handleDelete} onCancel={() => setConfirmDel(false)}/>}
    </div>
  );
}
