import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Badge, StatusBadge, Btn, Modal, Field, inputStyle, ConfirmModal, formatCurrency, formatDate, ActionMenu, PageHeader, EmptyState } from '../components/UI';
import { Search, MapPin, Mail, Building2, Plus, Loader } from 'lucide-react';
import clientService from '../services/clientService';

const INDUSTRIES = ['E-Commerce','Healthcare','Fintech','Retail','Logistics','Real Estate','HR Tech','Manufacturing','Education','Other'];
const EMPTY = { name:'', contactPerson:'', email:'', phone:'', city:'', industry:'', status:'active', notes:'' };

export default function ClientsPage() {
  const { clients, setClients, projects, clientServices, isManagement, isBD } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [apiError, setApiError]   = useState(null);

  /* ── Load clients on mount ─────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await clientService.getAll();
        setClients(data);
      } catch {
        setApiError('Failed to load clients. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ name: c.name, contactPerson: c.contactPerson, email: c.email, phone: c.phone, city: c.city, industry: c.industry, status: c.status, notes: c.notes });
    setEditing(c.id); setErrors({}); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Required';
    if (!form.contactPerson?.trim()) e.contactPerson = 'Required';
    if (!form.email?.trim()) e.email = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await clientService.update(editing, form);
        setClients(prev => prev.map(c => c.id === editing ? updated : c));
      } else {
        const created = await clientService.create(form);
        setClients(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save. Please try again.';
      setErrors({ api: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await clientService.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Failed to delete client.');
    }
    setConfirmDelete(null);
  };

  const getStats = (clientId) => {
    const cProjects = projects.filter(p => p.clientId === clientId || p.clientId === String(clientId));
    const cServices = clientServices.filter(cs => cs.clientId === clientId || cs.clientId === String(clientId));
    const monthlyRevenue = cServices.reduce((s, cs) => s + (cs.status === 'active' ? cs.monthlyAmount : 0), 0);
    return { projectCount: cProjects.length, serviceCount: cServices.length, monthlyRevenue };
  };

  if (loading) return <LoadingState />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Clients"
        sub={`${clients.length} clients in your portfolio`}
        action={(isManagement || isBD) && <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Client</Btn>}
      />

      {apiError && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--danger-dim)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: 14, marginBottom: 16 }}>
          {apiError}
        </div>
      )}

      {/* Search */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <div style={{ flex:1, maxWidth:340, display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36 }}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
            style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}/>
        </div>
        <span style={{ fontSize:14, color:'var(--text-muted)', alignSelf:'center' }}>{filtered.length} of {clients.length}</span>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
        {filtered.map(c => {
          const stats = getStats(c.id);
          return (
            <Card key={c.id} hover onClick={() => navigate(`/clients/${c.id}`)} style={{ padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, lineHeight:1.3 }}>{c.name}</div>
                  <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>{c.industry}</div>
                </div>
                <StatusBadge status={c.status}/>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                {c.contactPerson && <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:14, color:'var(--text-dim)' }}><Building2 size={12} color="var(--text-muted)"/>{c.contactPerson}</div>}
                {c.city && <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:14, color:'var(--text-dim)' }}><MapPin size={12} color="var(--text-muted)"/>{c.city}</div>}
                {c.email && <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:14, color:'var(--text-dim)' }}><Mail size={12} color="var(--text-muted)"/>{c.email}</div>}
              </div>

              <div style={{ display:'flex', gap:6, paddingTop:10, borderTop:'1px solid var(--border)', flexWrap:'wrap' }}>
                <Chip label={`${stats.projectCount} Projects`} color="#2E6DB4"/>
                <Chip label={`${stats.serviceCount} Services`} color="#4C3A9E"/>
                {stats.monthlyRevenue > 0 && <Chip label={`${formatCurrency(stats.monthlyRevenue)}/mo`} color="var(--success)"/>}
              </div>

              {(isManagement || isBD) && (
                <div style={{ marginTop:10, display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} style={{ padding:'4px 10px', fontSize:12, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'#2E6DB4', fontWeight:700, cursor:'pointer' }}>Edit</button>
                  {isManagement && <button onClick={() => setConfirmDelete(c.id)} style={{ padding:'4px 10px', fontSize:12, borderRadius:6, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', color:'var(--danger)', fontWeight:700, cursor:'pointer' }}>Delete</button>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && !loading && <EmptyState message="No clients found." />}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit Client' : 'Add New Client'}
          subtitle="Client profile and contact information"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Client'}
              </Btn>
            </>
          }
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14 }}>{errors.api}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Company Name" required error={errors.name}><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inputStyle(errors.name)}/></Field>
              <Field label="Contact Person" required error={errors.contactPerson}><input value={form.contactPerson} onChange={e => setForm(f=>({...f,contactPerson:e.target.value}))} style={inputStyle(errors.contactPerson)}/></Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Email" required error={errors.email}><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={inputStyle(errors.email)}/></Field>
              <Field label="Phone"><input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} style={inputStyle()}/></Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="City"><input value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} style={inputStyle()}/></Field>
              <Field label="Industry">
                <select value={form.industry} onChange={e => setForm(f=>({...f,industry:e.target.value}))} style={inputStyle()}>
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{...inputStyle(), resize:'vertical'}} placeholder="Internal notes…"/>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Delete this client? This will not delete their projects or services."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function Chip({ label, color }) {
  return <span style={{ fontSize:12, padding:'2px 8px', borderRadius:10, background:`${color}12`, color, border:`1px solid ${color}25`, fontWeight:700 }}>{label}</span>;
}

function LoadingState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ height:40, background:'var(--bg-elevated)', borderRadius:8, animation:'pulse 1.5s infinite' }}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:14 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height:160, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', animation:'pulse 1.5s infinite' }}/>
        ))}
      </div>
    </div>
  );
}
