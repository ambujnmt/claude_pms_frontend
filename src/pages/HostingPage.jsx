import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Badge, StatusBadge, Btn, Modal, Field, inputStyle, ConfirmModal, formatCurrency, formatDate, PageHeader, Table, TR, TD, ActionMenu, EmptyState } from '../components/UI';
import { Server, AlertTriangle, CheckCircle2, Clock, Globe, Shield, Plus } from 'lucide-react';

const PLANS = ['Starter', 'Business', 'Enterprise'];
const SERVERS = ['AWS Mumbai', 'AWS Mumbai (PCI Zone)', 'DigitalOcean Bangalore', 'GCP Mumbai', 'Azure West India'];
const ADDONS_LIST = ['SSL', 'Daily Backup', 'Weekly Backup', 'CDN', 'WAF', 'DDoS Protection'];
const STATUS_OPTS = ['active', 'due-soon', 'overdue'];
const EMPTY = { clientId: '', clientName: '', domain: '', plan: 'Business', server: 'AWS Mumbai', renewalDate: '', annualAmount: '', status: 'active', addons: [], contactEmail: '' };

export default function HostingPage() { const { hostingProjects, clients, addHosting, updateHosting, deleteHosting, isManagement } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors] = useState({});

  const overdue  = hostingProjects.filter(h => h.status === 'overdue');
  const dueSoon  = hostingProjects.filter(h => h.status === 'due-soon');
  const totalAnnual = hostingProjects.reduce((s, h) => s + h.annualAmount, 0);
  const sorted = [...hostingProjects].sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (h) => { setForm({ clientId: h.clientId || '', clientName: h.clientName, domain: h.domain, plan: h.plan, server: h.server, renewalDate: h.renewalDate, annualAmount: h.annualAmount, status: h.status, addons: [...h.addons], contactEmail: h.contactEmail }); setEditing(h.id); setErrors({}); setShowModal(true); };

  const validate = () => { const e = {};
    if (!form.clientName.trim()) e.clientName = 'Required';
    if (!form.domain.trim()) e.domain = 'Required';
    if (!form.renewalDate) e.renewalDate = 'Required';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (!validate()) return;
    const data = { ...form, annualAmount: parseInt(form.annualAmount) || 0 };
    editing ? updateHosting(editing, data) : addHosting(data);
    setShowModal(false);
  };

  const toggleAddon = (addon) => setForm(f => ({ ...f, addons: f.addons.includes(addon) ? f.addons.filter(a => a !== addon) : [...f.addons, addon] }));

  const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));
  const planColors = { Enterprise: 'var(--violet)', Business: 'var(--accent)', Starter: 'var(--text-muted)' };

  return (
    <div className="fade-in">
      <PageHeader
        title="Hosting"
        sub={`${hostingProjects.length} hosted clients · ${formatCurrency(totalAnnual)}/year`}
        action={isManagement && <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Hosting</Btn>}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { icon: <Server size={16} />, label: 'Hosted Clients', val: hostingProjects.length, color: 'var(--accent)' }, { icon: <AlertTriangle size={16} />, label: 'Overdue Renewals', val: overdue.length, color: 'var(--danger)' }, { icon: <Clock size={16} />, label: 'Due Within 30d', val: dueSoon.length, color: 'var(--orange)' }, { icon: <CheckCircle2 size={16} />, label: 'Annual Revenue', val: formatCurrency(totalAnnual), color: 'var(--success)' }, ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid #A01C1C20', marginBottom: 16, fontSize: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={14} color="var(--danger)" />
          <div><strong style={{ color: 'var(--danger)' }}>Action needed:</strong>
            {overdue.length > 0 && ` ${overdue.map(h => h.clientName).join(', ')} — overdue.`}
            {dueSoon.length > 0 && ` ${dueSoon.map(h => h.clientName).join(', ')} — renewing soon.`}
          </div>
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700 }}>All Hosted Clients</div>
        <Table headers={['Client', 'Domain', 'Plan', 'Server', 'Add-ons', 'Annual', 'Renewal', 'Days', 'Status', isManagement ? 'Actions' : '']}>
          {sorted.map(h => { const days = daysUntil(h.renewalDate);
            return (
              <TR key={h.id} highlighted={h.status === 'overdue'}>
                <TD><div style={{ fontWeight: 700 }}>{h.clientName}</div><div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{h.contactEmail}</div></TD>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={10} color="var(--text-muted)" /><span style={{ fontSize: 14 }}>{h.domain}</span></div></TD>
                <TD><Badge label={h.plan} color={planColors[h.plan] || 'var(--accent)'} /></TD>
                <TD><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{h.server}</span></TD>
                <TD><div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 150 }}>{h.addons.map(a => <span key={a} style={{ fontSize: 14, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>{a}</span>)}</div></TD>
                <TD><span style={{ fontWeight: 700 }}>{formatCurrency(h.annualAmount)}</span></TD>
                <TD><span style={{ fontSize: 14, color: days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--orange)' : 'var(--text-muted)', fontWeight: days < 0 ? 700 : 400 }}>{formatDate(h.renewalDate)}</span></TD>
                <TD><span style={{ fontSize: 14, fontWeight: 700, color: days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--orange)' : 'var(--text-muted)' }}>{days < 0 ? `${Math.abs(days)}d late` : `${days}d`}</span></TD>
                <TD><StatusBadge status={h.status} /></TD>
                {isManagement && <TD><ActionMenu onEdit={() => openEdit(h)} onDelete={() => setConfirmDel(h.id)} /></TD>}
              </TR>
            );
          })}
        </Table>
        {!sorted.length && <EmptyState message="No hosting records." />}
      </Card>

      {/* Plan breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {PLANS.map(plan => { const pc = hostingProjects.filter(h => h.plan === plan);
          const rev = pc.reduce((s, h) => s + h.annualAmount, 0);
          return (
            <Card key={plan} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Badge label={plan} color={planColors[plan]} />
                <span style={{ fontWeight: 700, color: planColors[plan] }}>{formatCurrency(rev)}/yr</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{pc.length} client{pc.length !== 1 ? 's' : ''}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 3 }}>{pc.map(h => h.clientName).join(', ') || '—'}</div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Hosting Record' : 'Add Hosting Record'} onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave}>{editing ? 'Save' : 'Add Hosting'}</Btn></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Client" required error={errors.clientName}>
                <select value={form.clientId} onChange={e => { const c = clients.find(c => c.id === e.target.value); setForm(f => ({ ...f, clientId: e.target.value, clientName: c?.name || '' })); }} style={inputStyle(errors.clientName)}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Domain" required error={errors.domain}><input value={form.domain} onChange={e => setForm(f => ({...f, domain: e.target.value}))} placeholder="example.com" style={inputStyle(errors.domain)} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Plan">
                <select value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))} style={inputStyle()}>
                  {PLANS.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Annual Amount (₹)"><input type="number" value={form.annualAmount} onChange={e => setForm(f => ({...f, annualAmount: e.target.value}))} style={inputStyle()} /></Field>
              <Field label="Renewal Date" required error={errors.renewalDate}><input type="date" value={form.renewalDate} onChange={e => setForm(f => ({...f, renewalDate: e.target.value}))} style={inputStyle(errors.renewalDate)} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Server">
                <select value={form.server} onChange={e => setForm(f => ({...f, server: e.target.value}))} style={inputStyle()}>
                  {SERVERS.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} style={inputStyle()}>
                  {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Contact Email"><input type="email" value={form.contactEmail} onChange={e => setForm(f => ({...f, contactEmail: e.target.value}))} style={inputStyle()} /></Field>
            <Field label="Add-ons">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ADDONS_LIST.map(a => (
                  <div key={a} onClick={() => toggleAddon(a)} style={{ padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 700, border: `1.5px solid ${form.addons.includes(a) ? 'var(--accent)' : 'var(--border)'}`, background: form.addons.includes(a) ? 'var(--accent-dim)' : 'var(--bg-elevated)', color: form.addons.includes(a) ? 'var(--accent)' : 'var(--text-muted)' }}>{a}</div>
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Delete this hosting record?" onConfirm={() => { deleteHosting(confirmDel); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}
