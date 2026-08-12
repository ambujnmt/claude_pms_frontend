import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Badge, StatusBadge, Btn, Modal, Field, inputStyle, ConfirmModal, formatCurrency, formatDate, ActionMenu, PageHeader, EmptyState } from '../components/UI';
import { Search, MapPin, Phone, Mail, Building2, Plus } from 'lucide-react';

const INDUSTRIES = ['E-Commerce','Healthcare','Fintech','Retail','Logistics','Real Estate','HR Tech','Manufacturing','Education','Other'];
const EMPTY = { name:'', contactPerson:'', email:'', phone:'', city:'', industry:'', status:'active', notes:'' };

export default function ClientsPage() { const { clients, projects, clientServices, addClient, updateClient, deleteClient, isManagement, isBD } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // client id being edited
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (c) => { setForm({ name: c.name, contactPerson: c.contactPerson, email: c.email, phone: c.phone, city: c.city, industry: c.industry, status: c.status, notes: c.notes }); setEditing(c.id); setErrors({}); setShowModal(true); };

  const validate = () => { const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.contactPerson.trim()) e.contactPerson = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (!validate()) return;
    editing ? updateClient(editing, form) : addClient(form);
    setShowModal(false);
  };

  const getClientStats = (clientId) => { const cProjects = projects.filter(p => p.clientId === clientId);
    const cServices = clientServices.filter(cs => cs.clientId === clientId);
    const monthlyRevenue = cServices.reduce((s, cs) => s + (cs.status === 'active' ? cs.monthlyAmount : 0), 0);
    return { projectCount: cProjects.length, serviceCount: cServices.length, monthlyRevenue };
  };

  const statusColor = { active: 'var(--success)', 'on-hold': 'var(--warning)', inactive: 'var(--text-muted)' };

  return (
    <div className="fade-in">
      <PageHeader
        title="Clients"
        sub={`${clients.length} clients in your portfolio`}
        action={(isManagement || isBD) && <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Client</Btn>}
      />

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, maxWidth: 340, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', height: 36 }}>
          <Search size={13} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 14, flex: 1, fontFamily: 'var(--font-body)' }} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} of {clients.length}</div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(c => { const stats = getClientStats(c.id);
          return (
            <Card key={c.id} hover onClick={() => navigate(`/clients/${c.id}`)} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{c.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{c.industry}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--text-dim)' }}>
                  <Building2 size={12} color="var(--text-muted)" />{c.contactPerson}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--text-dim)' }}>
                  <MapPin size={12} color="var(--text-muted)" />{c.city}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--text-dim)' }}>
                  <Mail size={12} color="var(--text-muted)" />{c.email}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <Chip label={`${stats.projectCount} Projects`} color="var(--accent)" />
                <Chip label={`${stats.serviceCount} Services`} color="var(--violet)" />
                {stats.monthlyRevenue > 0 && <Chip label={`${formatCurrency(stats.monthlyRevenue)}/mo`} color="var(--success)" />}
              </div>

              {/* Action buttons — stop propagation */}
              {(isManagement || isBD) && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} style={{ padding: '4px 10px', fontSize: 14, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: '#2E6DB4', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                  {isManagement && <button onClick={() => setConfirmDelete(c.id)} style={{ padding: '4px 10px', fontSize: 14, borderRadius: 6, border: '1px solid #A01C1C30', background: '#A01C1C08', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer' }}>Delete</button>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <EmptyState message="No clients found." />}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Client' : 'Add New Client'} subtitle="Client profile and contact information" onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave}>{editing ? 'Save Changes' : 'Add Client'}</Btn></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Company Name" required error={errors.name}><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inputStyle(errors.name)} /></Field>
              <Field label="Contact Person" required error={errors.contactPerson}><input value={form.contactPerson} onChange={e => setForm(f => ({...f, contactPerson: e.target.value}))} style={inputStyle(errors.contactPerson)} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Email" required error={errors.email}><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} style={inputStyle(errors.email)} /></Field>
              <Field label="Phone"><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} style={inputStyle()} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="City"><input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} style={inputStyle()} /></Field>
              <Field label="Industry">
                <select value={form.industry} onChange={e => setForm(f => ({...f, industry: e.target.value}))} style={inputStyle()}>
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} style={{ ...inputStyle(), resize: 'vertical' }} placeholder="Internal notes about this client..." />
            </Field>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmModal
          message="Delete this client? This will not delete their projects or services."
          onConfirm={() => { deleteClient(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function Chip({ label, color }) { return <span style={{ fontSize: 14, padding: '2px 8px', borderRadius: 10, background: `${color}12`, color, border: `1px solid ${color}25`, fontWeight: 700 }}>{label}</span>;
}
