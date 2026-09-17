import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, Badge, StatusBadge, Btn, Modal, Field, inputStyle,
  ConfirmModal, formatDate, ActionMenu, PageHeader, EmptyState,
} from '../components/UI';
import { Search, MapPin, Mail, Phone, Building2, Plus } from 'lucide-react';
import clientService from '../services/clientService';

const INDUSTRIES = [
  'E-Commerce','Healthcare','Fintech','Retail','Logistics',
  'Real Estate','HR Tech','Manufacturing','Education','Other',
];

const EMPTY_FORM = {
  name: '', contactPerson: '', email: '', phone: '',
  city: '', industry: '', status: 'active', notes: '',
};

export default function ClientsPage() {
  const {
    clients, setClients, projects, clientServices,
    fmt, isManagement, isBD,
  } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [editing, setEditing]           = useState(null);   // holds client ID being edited
  const [confirmDel, setConfirmDel]     = useState(null);   // holds client ID to delete
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [apiError, setApiError]         = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Load clients on mount ───────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const data = await clientService.getAll();
        setClients(data);
      } catch (err) {
        setApiError('Failed to load clients. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Filtered list ──────────────────────────────────── */
  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* ── Helpers ─────────────────────────────────────────── */
  const getClientStats = (clientId) => {
    const id = parseInt(clientId) || clientId;
    const cProjects = projects.filter(p => parseInt(p.clientId) === id || p.clientId === clientId);
    const cServices = clientServices.filter(cs => parseInt(cs.clientId) === id || cs.clientId === clientId);
    const monthly   = cServices.filter(cs => cs.status === 'active').reduce((s, cs) => s + (cs.monthlyAmount || 0), 0);
    return { projectCount: cProjects.length, serviceCount: cServices.length, monthly };
  };

  /* ── Open Add Modal ──────────────────────────────────── */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setErrors({});
    setShowModal(true);
  };

  /* ── Open Edit Modal ─────────────────────────────────── */
  const openEdit = (e, client) => {
    e.stopPropagation();   // prevent card navigation click
    setForm({
      name:          client.name          || '',
      contactPerson: client.contactPerson || '',
      email:         client.email         || '',
      phone:         client.phone         || '',
      city:          client.city          || '',
      industry:      client.industry      || '',
      status:        client.status        || 'active',
      notes:         client.notes         || '',
    });
    setEditing(client.id);
    setErrors({});
    setShowModal(true);
  };

  /* ── Validate ────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name          = 'Company name is required.';
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required.';
    if (!form.email.trim())         e.email         = 'Email is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Save (Add or Edit) ──────────────────────────────── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      if (editing) {
        // ── UPDATE ────────────────────────────────────────
        const updated = await clientService.update(editing, form);
        setClients(prev => prev.map(c => c.id === editing ? updated : c));
      } else {
        // ── CREATE ────────────────────────────────────────
        const created = await clientService.create(form);
        setClients(prev => [created, ...prev]);
      }
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Failed to save client. Please try again.';
      setErrors({ api: msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ──────────────────────────────────────────── */
  const openDelete = (e, clientId) => {
    e.stopPropagation();
    setConfirmDel(clientId);
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await clientService.delete(confirmDel);
      setClients(prev => prev.filter(c => c.id !== confirmDel));
      setConfirmDel(null);
    } catch {
      alert('Failed to delete client. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const canEdit = isManagement || isBD;

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="fade-in">
      <PageHeader
        title="Clients"
        sub={`${clients.length} client${clients.length !== 1 ? 's' : ''} in your portfolio`}
        action={canEdit && (
          <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Client</Btn>
        )}
      />

      {/* API Error */}
      {apiError && (
        <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14, marginBottom:16, border:'1px solid var(--danger)' }}>
          {apiError}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ flex:1, minWidth:220, maxWidth:360, display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36 }}>
          <Search size={13} color="var(--text-muted)"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, contact, city…"
            style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}
          />
        </div>
        <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:3 }}>
          {['all','active','on-hold','inactive'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:filterStatus===s?'#2E6DB4':'transparent', color:filterStatus===s?'#fff':'var(--text-muted)', fontSize:13, cursor:'pointer', fontWeight:filterStatus===s?700:400, textTransform:'capitalize', fontFamily:'var(--font-body)' }}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{filtered.length} of {clients.length}</span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:14 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height:180, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.6 }}/>
          ))}
        </div>
      )}

      {/* Client cards */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:14 }}>
          {filtered.map(client => {
            const stats = getClientStats(client.id);
            return (
              <Card
                key={client.id}
                hover
                onClick={() => navigate(`/clients/${client.id}`)}
                style={{ padding:18, position:'relative' }}
              >
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ flex:1, paddingRight:8 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text)', lineHeight:1.3 }}>{client.name}</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{client.industry || 'No industry set'}</div>
                  </div>
                  <StatusBadge status={client.status}/>
                </div>

                {/* Contact info */}
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                  {client.contactPerson && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'var(--text-dim)' }}>
                      <Building2 size={12} color="var(--text-muted)"/>
                      {client.contactPerson}
                    </div>
                  )}
                  {client.city && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'var(--text-dim)' }}>
                      <MapPin size={12} color="var(--text-muted)"/>
                      {client.city}
                    </div>
                  )}
                  {client.email && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'var(--text-dim)' }}>
                      <Mail size={12} color="var(--text-muted)"/>
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'var(--text-dim)' }}>
                      <Phone size={12} color="var(--text-muted)"/>
                      {client.phone}
                    </div>
                  )}
                </div>

                {/* Stats chips */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:10, borderTop:'1px solid var(--border)', marginBottom:10 }}>
                  <Chip label={`${stats.projectCount} Project${stats.projectCount !== 1 ? 's' : ''}`} color="#2E6DB4"/>
                  <Chip label={`${stats.serviceCount} Service${stats.serviceCount !== 1 ? 's' : ''}`} color="#4C3A9E"/>
                  {stats.monthly > 0 && <Chip label={`${fmt(stats.monthly)}/mo`} color="var(--success)"/>}
                </div>

                {/* Edit / Delete buttons */}
                {canEdit && (
                  <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => openEdit(e, client)}
                      style={{ flex:1, padding:'5px 0', fontSize:12, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'#2E6DB4', fontWeight:600, cursor:'pointer' }}
                    >
                      Edit
                    </button>
                    {isManagement && (
                      <button
                        onClick={e => openDelete(e, client.id)}
                        style={{ flex:1, padding:'5px 0', fontSize:12, borderRadius:6, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontWeight:600, cursor:'pointer' }}
                      >
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
        <EmptyState message={search ? `No clients match "${search}"` : 'No clients yet. Add your first client.'}/>
      )}

      {/* ── Add / Edit Modal ───────────────────────────── */}
      {showModal && (
        <Modal
          title={editing ? 'Edit Client' : 'Add New Client'}
          subtitle="Client profile and contact details"
          onClose={() => { setShowModal(false); setEditing(null); setErrors({}); }}
          width={580}
          footer={
            <>
              <Btn variant="ghost" onClick={() => { setShowModal(false); setEditing(null); setErrors({}); }}>
                Cancel
              </Btn>
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Client'}
              </Btn>
            </>
          }
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* API error */}
            {errors.api && (
              <div style={{ padding:'9px 13px', borderRadius:8, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13, border:'1px solid var(--danger)' }}>
                {errors.api}
              </div>
            )}

            {/* Row 1 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Company Name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. TechVenture Pvt. Ltd."
                  style={inputStyle(errors.name)}
                  autoFocus
                />
              </Field>
              <Field label="Contact Person" required error={errors.contactPerson}>
                <input
                  value={form.contactPerson}
                  onChange={e => set('contactPerson', e.target.value)}
                  placeholder="Primary contact name"
                  style={inputStyle(errors.contactPerson)}
                />
              </Field>
            </div>

            {/* Row 2 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="contact@company.com"
                  style={inputStyle(errors.email)}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  style={inputStyle()}
                />
              </Field>
            </div>

            {/* Row 3 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="City">
                <input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Bangalore"
                  style={inputStyle()}
                />
              </Field>
              <Field label="Industry">
                <select
                  value={form.industry}
                  onChange={e => set('industry', e.target.value)}
                  style={inputStyle()}
                >
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  style={inputStyle()}
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            {/* Notes */}
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Internal notes about this client…"
                style={{ ...inputStyle(), resize:'vertical' }}
              />
            </Field>

          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation ───────────────────────── */}
      {confirmDel && (
        <ConfirmModal
          message="Delete this client? Their projects and services will remain but the client record will be removed."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function Chip({ label, color }) {
  return (
    <span style={{ fontSize:12, padding:'2px 8px', borderRadius:10, background:`${color}12`, color, border:`1px solid ${color}25`, fontWeight:700 }}>
      {label}
    </span>
  );
}
