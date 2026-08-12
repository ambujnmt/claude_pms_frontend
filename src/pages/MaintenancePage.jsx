import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, PageHeader, Table, TR, TD, Badge, StatusBadge, ActionMenu,
  Modal, Field, inputStyle, Btn, ConfirmModal, formatCurrency, formatDate, EmptyState,
} from '../components/UI';
import { Plus, Wrench, TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

/* Service IDs that count as "maintenance" contracts */
const MAINTENANCE_SERVICE_IDS = ['sv1','sv2','sv3','sv4','sv5','sv6','sv7','sv8','sv9'];

/* Which service types are considered "maintenance" in nature */
const MAINTENANCE_TYPES = {
  sv1: 'Development Maintenance',
  sv2: 'Development Maintenance',
  sv3: 'AI/ML Maintenance',
  sv4: 'SEO',
  sv5: 'PPC Management',
  sv6: 'Social Media',
  sv7: 'Hosting & Support',
  sv8: 'Content Marketing',
  sv9: 'UI/UX Retainer',
};

const CONTRACT_TYPES = ['Development Maintenance', 'SEO', 'PPC Management', 'Social Media', 'Hosting & Support', 'Content Marketing', 'UI/UX Retainer', 'AI/ML Maintenance', 'Other'];
const BILLING_CYCLES = ['monthly', 'quarterly', 'annual'];
const STATUS_OPTS    = ['active', 'paused', 'cancelled'];

const EMPTY_FORM = {
  clientId: '', serviceId: '', name: '', contractType: 'SEO',
  monthlyAmount: '', billingCycle: 'monthly',
  startDate: '', renewalDate: '', status: 'active', notes: '',
};

const TYPE_COLOR = {
  'SEO':                    '#1A6B3C',
  'PPC Management':         '#8B5E0A',
  'Social Media':           '#9B1C1C',
  'Development Maintenance':'#1B2E6B',
  'Hosting & Support':      '#2E6DB4',
  'Content Marketing':      '#4C3A9E',
  'UI/UX Retainer':         '#4A90D9',
  'AI/ML Maintenance':      '#A85010',
  'Other':                  '#6B7A99',
};

export default function MaintenancePage() {
  const navigate = useNavigate();
  const {
    clients, clientServices, serviceTypes,
    addClientService, updateClientService, deleteClientService,
    isManagement, isBD,
  } = useApp();

  const [tab, setTab]           = useState('all');      // 'all' | 'dev' | 'seo' | 'ppc'
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editing, setEditing]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]     = useState({});
  const [search, setSearch]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* All client services that are maintenance/retainer in nature */
  const allMaintenance = clientServices.filter(cs =>
    MAINTENANCE_SERVICE_IDS.includes(cs.serviceId) || cs.contractType
  );

  /* Tab filters */
  const tabFilter = (cs) => {
    const svc = serviceTypes.find(s => s.id === cs.serviceId);
    const type = cs.contractType || MAINTENANCE_TYPES[cs.serviceId] || '';
    if (tab === 'dev')  return type.toLowerCase().includes('development') || type.toLowerCase().includes('ai');
    if (tab === 'seo')  return type.toLowerCase().includes('seo');
    if (tab === 'ppc')  return type.toLowerCase().includes('ppc') || type.toLowerCase().includes('social') || type.toLowerCase().includes('content');
    return true;
  };

  const filtered = allMaintenance.filter(cs => {
    const client = clients.find(c => c.id === cs.clientId);
    const matchSearch = !search ||
      cs.name.toLowerCase().includes(search.toLowerCase()) ||
      (client?.name || '').toLowerCase().includes(search.toLowerCase());
    return tabFilter(cs) && matchSearch;
  });

  /* Stats */
  const activeContracts  = allMaintenance.filter(cs => cs.status === 'active');
  const totalMonthly     = activeContracts.reduce((s, cs) => s + cs.monthlyAmount, 0);
  const uniqueClients    = new Set(activeContracts.map(cs => cs.clientId)).size;
  const pausedCount      = allMaintenance.filter(cs => cs.status === 'paused').length;

  const validate = () => {
    const e = {};
    if (!form.clientId)         e.clientId = 'Select a client';
    if (!form.name.trim())      e.name     = 'Required';
    if (!form.monthlyAmount)    e.monthlyAmount = 'Required';
    if (!form.startDate)        e.startDate = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setForm(EMPTY_FORM); setEditing(null); setErrors({}); setShowModal(true);
  };

  const openEdit = (cs) => {
    setForm({
      clientId:      cs.clientId || '',
      serviceId:     cs.serviceId || '',
      name:          cs.name,
      contractType:  cs.contractType || MAINTENANCE_TYPES[cs.serviceId] || 'Other',
      monthlyAmount: cs.monthlyAmount,
      billingCycle:  cs.billingCycle || 'monthly',
      startDate:     cs.startDate || '',
      renewalDate:   cs.renewalDate || '',
      status:        cs.status,
      notes:         cs.notes || '',
    });
    setEditing(cs.id); setErrors({}); setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      ...form,
      monthlyAmount: parseFloat(form.monthlyAmount) || 0,
      contractType: form.contractType,
    };
    editing ? updateClientService(editing, data) : addClientService(data);
    setShowModal(false);
  };

  const TABS = [
    { k: 'all', label: 'All Contracts' },
    { k: 'dev', label: 'Development / AI' },
    { k: 'seo', label: 'SEO' },
    { k: 'ppc', label: 'PPC / Social / Content' },
  ];

  const canEdit = isManagement || isBD;

  return (
    <div className="fade-in">
      <PageHeader
        title="Maintenance"
        sub="Ongoing retainers and recurring service contracts"
        action={canEdit && (
          <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Contract</Btn>
        )}
      />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: <Wrench size={16} />,       label: 'Active Contracts',   value: activeContracts.length, color: '#1B2E6B', bg: '#EEF2FA' },
          { icon: <Users size={16} />,         label: 'Clients on Retainer',value: uniqueClients,          color: '#2E6DB4', bg: '#EDF4FB' },
          { icon: <TrendingUp size={16} />,    label: 'Monthly Revenue',    value: formatCurrency(totalMonthly), color: '#1A6B3C', bg: '#EDF7F2' },
          { icon: <AlertCircle size={16} />,   label: 'Paused',             value: pausedCount,            color: '#8B5E0A', bg: '#FBF5EC' },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === t.k ? '#1B2E6B' : 'transparent',
              color: tab === t.k ? '#fff' : 'var(--text-muted)',
              fontSize: 14, fontWeight: tab === t.k ? 600 : 400, transition: 'all 0.13s',
            }}>{t.label}</button>
          ))}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by client or contract name…"
          style={{ ...inputStyle(), flex: 1, maxWidth: 300 }}
        />
        <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} contract{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Main table */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <Table headers={['Client', 'Contract Name', 'Type', 'Monthly', 'Billing', 'Start Date', 'Renewal', 'Status', 'Notes', canEdit ? 'Actions' : '']}>
          {filtered.length === 0 && (
            <TR>
              <td colSpan={10} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No maintenance contracts found{tab !== 'all' ? ' for this filter' : ''}. {canEdit && <span style={{ color: '#2E6DB4', cursor: 'pointer', fontWeight: 600 }} onClick={openAdd}>Add one →</span>}
              </td>
            </TR>
          )}
          {filtered.map(cs => {
            const client = clients.find(c => c.id === cs.clientId);
            const svc    = serviceTypes.find(s => s.id === cs.serviceId);
            const ctype  = cs.contractType || MAINTENANCE_TYPES[cs.serviceId] || 'Other';
            const tcolor = TYPE_COLOR[ctype] || 'var(--text-muted)';
            return (
              <TR key={cs.id}>
                <TD>
                  <div
                    style={{ fontWeight: 600, color: '#2E6DB4', cursor: 'pointer' }}
                    onClick={() => client && navigate(`/clients/${client.id}`)}
                  >
                    {client?.name || cs.clientId}
                  </div>
                  {client?.city && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{client.city}</div>}
                </TD>
                <TD><div style={{ fontWeight: 500 }}>{cs.name}</div></TD>
                <TD><Badge label={ctype} color={tcolor} /></TD>
                <TD><span style={{ fontWeight: 700, color: '#1A6B3C' }}>{formatCurrency(cs.monthlyAmount)}</span></TD>
                <TD><span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cs.billingCycle}</span></TD>
                <TD><span style={{ color: 'var(--text-muted)' }}>{formatDate(cs.startDate)}</span></TD>
                <TD>
                  {cs.renewalDate
                    ? <span style={{ color: new Date(cs.renewalDate) < new Date() ? 'var(--danger)' : 'var(--text-muted)' }}>{formatDate(cs.renewalDate)}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </TD>
                <TD><StatusBadge status={cs.status} /></TD>
                <TD><span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{cs.notes || '—'}</span></TD>
                {canEdit && <TD><ActionMenu onEdit={() => openEdit(cs)} onDelete={() => setConfirmDel(cs.id)} /></TD>}
              </TR>
            );
          })}
        </Table>
      </Card>

      {/* Revenue breakdown by type */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2E6B', marginBottom: 14 }}>Revenue by Service Type</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {CONTRACT_TYPES.map(type => {
            const contracts = allMaintenance.filter(cs => (cs.contractType || MAINTENANCE_TYPES[cs.serviceId] || 'Other') === type && cs.status === 'active');
            if (!contracts.length) return null;
            const rev = contracts.reduce((s, cs) => s + cs.monthlyAmount, 0);
            return (
              <Card key={type} style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Badge label={type} color={TYPE_COLOR[type] || 'var(--text-muted)'} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TYPE_COLOR[type] || 'var(--text-muted)' }}>{formatCurrency(rev)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 3 }}>{contracts.length} client{contracts.length !== 1 ? 's' : ''}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit Maintenance Contract' : 'Add Maintenance Contract'}
          subtitle="Recurring service agreement or retainer"
          onClose={() => setShowModal(false)}
          width={600}
          footer={
            <>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleSave}>{editing ? 'Save Changes' : 'Add Contract'}</Btn>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Client */}
            <Field label="Client" required error={errors.clientId}>
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} style={inputStyle(errors.clientId)}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            {/* Contract Name */}
            <Field label="Contract / Service Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Monthly SEO Retainer — TechVenture"
                style={inputStyle(errors.name)}
              />
            </Field>

            {/* Type + Service */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Contract Type">
                <select value={form.contractType} onChange={e => set('contractType', e.target.value)} style={inputStyle()}>
                  {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Service Catalogue Link">
                <select value={form.serviceId} onChange={e => set('serviceId', e.target.value)} style={inputStyle()}>
                  <option value="">None / Custom</option>
                  {serviceTypes.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </Field>
            </div>

            {/* Amount + Billing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Monthly Amount (₹)" required error={errors.monthlyAmount}>
                <input
                  type="number"
                  value={form.monthlyAmount}
                  onChange={e => set('monthlyAmount', e.target.value)}
                  placeholder="e.g. 15000"
                  style={inputStyle(errors.monthlyAmount)}
                />
              </Field>
              <Field label="Billing Cycle">
                <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)} style={inputStyle()}>
                  {BILLING_CYCLES.map(b => <option key={b} value={b} style={{ textTransform: 'capitalize' }}>{b}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle()}>
                  {STATUS_OPTS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                </select>
              </Field>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Start Date" required error={errors.startDate}>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle(errors.startDate)} />
              </Field>
              <Field label="Renewal Date">
                <input type="date" value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} style={inputStyle()} />
              </Field>
            </div>

            {/* Notes */}
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={2}
                placeholder="Any specifics, scope, or SLA details…"
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <ConfirmModal
          message="Remove this maintenance contract? This cannot be undone."
          onConfirm={() => { deleteClientService(confirmDel); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}


