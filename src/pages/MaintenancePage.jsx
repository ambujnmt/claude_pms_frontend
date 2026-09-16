import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, PageHeader, Table, TR, TD, Badge, StatusBadge, ActionMenu, Modal, Field, inputStyle, Btn, ConfirmModal, formatDate, EmptyState } from '../components/UI';
import { Plus, Wrench, TrendingUp, Users, AlertCircle } from 'lucide-react';
import clientServiceApi from '../services/clientServiceApi';

const CONTRACT_TYPES = ['Development Maintenance','SEO','PPC Management','Social Media','Hosting & Support','Content Marketing','UI/UX Retainer','AI/ML Maintenance','Other'];
const BILLING_CYCLES = ['monthly','quarterly','annual'];
const STATUS_OPTS    = ['active','paused','cancelled'];

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

const EMPTY = { clientId:'', serviceId:'', name:'', contractType:'SEO', monthlyAmount:'', billingCycle:'monthly', startDate:'', renewalDate:'', status:'active', notes:'' };

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { clients, clientServices, setClientServices, serviceTypes, isManagement, isBD , fmt } = useApp();

  const [tab, setTab]             = useState('all');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(false);

  /* ── Load on mount ─────────────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await clientServiceApi.getAll();
        setClientServices(data);
      } catch {
        console.error('Failed to load maintenance contracts');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const tabFilter = (cs) => {
    const type = cs.contractType || '';
    if (tab === 'dev') return type.toLowerCase().includes('development') || type.toLowerCase().includes('ai');
    if (tab === 'seo') return type.toLowerCase().includes('seo');
    if (tab === 'ppc') return ['ppc management','social media','content marketing'].some(t => type.toLowerCase().includes(t.toLowerCase()));
    return true;
  };

  const filtered = clientServices.filter(cs => {
    const client = clients.find(c => c.id === cs.clientId || c.id === parseInt(cs.clientId));
    const matchSearch = !search ||
      cs.name.toLowerCase().includes(search.toLowerCase()) ||
      (client?.name||'').toLowerCase().includes(search.toLowerCase());
    return tabFilter(cs) && matchSearch;
  });

  const activeContracts = clientServices.filter(cs => cs.status === 'active');
  const totalMonthly    = activeContracts.reduce((s, cs) => s + cs.monthlyAmount, 0);
  const uniqueClients   = new Set(activeContracts.map(cs => cs.clientId)).size;
  const pausedCount     = clientServices.filter(cs => cs.status === 'paused').length;

  const validate = () => {
    const e = {};
    if (!form.clientId)      e.clientId = 'Select a client';
    if (!form.name.trim())   e.name     = 'Required';
    if (!form.monthlyAmount) e.monthlyAmount = 'Required';
    if (!form.startDate)     e.startDate = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (cs) => {
    setForm({ clientId: cs.clientId, serviceId: cs.serviceId||'', name: cs.name, contractType: cs.contractType||'Other', monthlyAmount: cs.monthlyAmount, billingCycle: cs.billingCycle||'monthly', startDate: cs.startDate||'', renewalDate: cs.renewalDate||'', status: cs.status, notes: cs.notes||'' });
    setEditing(cs.id); setErrors({}); setShowModal(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, clientId: parseInt(form.clientId), serviceId: form.serviceId ? parseInt(form.serviceId) : null };
      if (editing) {
        const updated = await clientServiceApi.update(editing, payload);
        setClientServices(prev => prev.map(cs => cs.id === editing ? updated : cs));
      } else {
        const created = await clientServiceApi.create(payload);
        setClientServices(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch {
      setErrors({ api: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await clientServiceApi.delete(id);
      setClientServices(prev => prev.filter(cs => cs.id !== id));
    } catch {
      alert('Failed to delete contract.');
    }
    setConfirmDel(null);
  };

  const canEdit = isManagement || isBD;
  const TABS = [['all','All Contracts'],['dev','Development / AI'],['seo','SEO'],['ppc','PPC / Social / Content']];

  return (
    <div className="fade-in">
      <PageHeader
        title="Maintenance"
        sub="Ongoing retainers and recurring service contracts"
        action={canEdit && <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Contract</Btn>}
      />

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:<Wrench size={16}/>,      label:'Active Contracts',    value:activeContracts.length,          color:'#1B2E6B', bg:'#EEF2FA' },
          { icon:<Users size={16}/>,        label:'Clients on Retainer', value:uniqueClients,                   color:'#2E6DB4', bg:'#EDF4FB' },
          { icon:<TrendingUp size={16}/>,   label:'Monthly Revenue',     value:fmt(totalMonthly),    color:'var(--success)', bg:'#EDF7F2' },
          { icon:<AlertCircle size={16}/>,  label:'Paused',              value:pausedCount,                     color:'#8B5E0A', bg:'#FBF5EC' },
        ].map(s => (
          <Card key={s.label} style={{ display:'flex', alignItems:'center', gap:12, padding:14 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:3 }}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', background: tab===k?'#1B2E6B':'transparent', color: tab===k?'#fff':'var(--text-muted)', fontSize:14, fontWeight: tab===k?700:400, transition:'all 0.13s' }}>{label}</button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or contract name…" style={{ ...inputStyle(), flex:1, maxWidth:300 }}/>
        <span style={{ fontSize:14, color:'var(--text-muted)', marginLeft:'auto' }}>{filtered.length} contract{filtered.length!==1?'s':''}</span>
      </div>

      {/* Table */}
      <Card style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
        {loading
          ? <div style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading contracts…</div>
          : (
            <Table headers={['Client','Contract Name','Type','Monthly','Billing','Start Date','Renewal','Status','Notes', canEdit?'Actions':'']}>
              {filtered.length === 0 && (
                <TR><td colSpan={10} style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                  No contracts found. {canEdit && <span style={{ color:'#2E6DB4', cursor:'pointer', fontWeight:600 }} onClick={openAdd}>Add one →</span>}
                </td></TR>
              )}
              {filtered.map(cs => {
                const client = clients.find(c => c.id===cs.clientId || c.id===parseInt(cs.clientId));
                const tcolor = TYPE_COLOR[cs.contractType] || 'var(--text-muted)';
                return (
                  <TR key={cs.id}>
                    <TD>
                      <div style={{ fontWeight:600, color:'#2E6DB4', cursor:'pointer' }} onClick={() => client && navigate(`/clients/${client.id}`)}>{client?.name || '—'}</div>
                      {client?.city && <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>{client.city}</div>}
                    </TD>
                    <TD><span style={{ fontWeight:500 }}>{cs.name}</span></TD>
                    <TD><Badge label={cs.contractType||'Other'} color={tcolor}/></TD>
                    <TD><span style={{ fontWeight:700, color:'var(--success)' }}>{fmt(cs.monthlyAmount)}</span></TD>
                    <TD><span style={{ color:'var(--text-muted)', textTransform:'capitalize' }}>{cs.billingCycle}</span></TD>
                    <TD><span style={{ color:'var(--text-muted)' }}>{formatDate(cs.startDate)}</span></TD>
                    <TD><span style={{ color:'var(--text-muted)' }}>{formatDate(cs.renewalDate)||'—'}</span></TD>
                    <TD><StatusBadge status={cs.status}/></TD>
                    <TD><span style={{ color:'var(--text-muted)', fontSize:14 }}>{cs.notes||'—'}</span></TD>
                    {canEdit && <TD><ActionMenu onEdit={() => openEdit(cs)} onDelete={() => setConfirmDel(cs.id)}/></TD>}
                  </TR>
                );
              })}
            </Table>
          )
        }
      </Card>

      {/* Revenue by type */}
      <div>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#1B2E6B', marginBottom:14 }}>Revenue by Service Type</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:10 }}>
          {CONTRACT_TYPES.map(type => {
            const contracts = clientServices.filter(cs => (cs.contractType||'Other')===type && cs.status==='active');
            if (!contracts.length) return null;
            const rev = contracts.reduce((s,cs) => s + cs.monthlyAmount, 0);
            return (
              <Card key={type} style={{ padding:'13px 16px' }}>
                <div style={{ marginBottom:6 }}><Badge label={type} color={TYPE_COLOR[type]||'var(--text-muted)'}/></div>
                <div style={{ fontSize:20, fontWeight:700, color:TYPE_COLOR[type]||'var(--text-muted)' }}>{fmt(rev)}<span style={{ fontSize:14, fontWeight:400, color:'var(--text-muted)' }}>/mo</span></div>
                <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{contracts.length} client{contracts.length!==1?'s':''}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editing?'Edit Contract':'Add Maintenance Contract'} subtitle="Recurring service agreement or retainer" onClose={() => setShowModal(false)} width={600}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Saving…':editing?'Save Changes':'Add Contract'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14 }}>{errors.api}</div>}
            <Field label="Client" required error={errors.clientId}>
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} style={inputStyle(errors.clientId)}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Contract / Service Name" required error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Monthly SEO Retainer" style={inputStyle(errors.name)}/>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Monthly Amount (₹)" required error={errors.monthlyAmount}>
                <input type="number" value={form.monthlyAmount} onChange={e => set('monthlyAmount', e.target.value)} placeholder="e.g. 15000" style={inputStyle(errors.monthlyAmount)}/>
              </Field>
              <Field label="Billing Cycle">
                <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)} style={inputStyle()}>
                  {BILLING_CYCLES.map(b => <option key={b} value={b} style={{ textTransform:'capitalize' }}>{b}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle()}>
                  {STATUS_OPTS.map(s => <option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Start Date" required error={errors.startDate}>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle(errors.startDate)}/>
              </Field>
              <Field label="Renewal Date">
                <input type="date" value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} style={inputStyle()}/>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Scope, SLA details…" style={{ ...inputStyle(), resize:'vertical' }}/>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Remove this maintenance contract?" onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}
