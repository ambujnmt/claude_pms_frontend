import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Btn, Modal, Field, inputStyle, ConfirmModal, formatCurrency, EmptyState, PageHeader, ActionMenu } from '../components/UI';
import { Plus } from 'lucide-react';
import serviceTypeService from '../services/serviceTypeService';

const COLOR_OPTS = ['#1B2E6B','#2E6DB4','#4A90D9','#4C3A9E','#1A6B3C','#8B5E0A','#9B1C1C'];
const ICONS      = ['💻','📱','🤖','🔍','📣','📲','🖥️','✍️','🎨','📊','🔧','📧','🌐','🎯','📈'];
const EMPTY      = { name:'', icon:'💻', color:'#1B2E6B', description:'' };

export default function ServicesPage() {
  const { serviceTypes, setServiceTypes, clientServices, isManagement } = useApp();
  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await serviceTypeService.getAll();
        setServiceTypes(data);
      } catch {
        console.error('Failed to load service types');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (s) => { setForm({ name:s.name, icon:s.icon, color:s.color, description:s.description }); setEditing(s.id); setErrors({}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setErrors({ name:'Required' }); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await serviceTypeService.update(editing, form);
        setServiceTypes(prev => prev.map(s => s.id === editing ? updated : s));
      } else {
        const created = await serviceTypeService.create(form);
        setServiceTypes(prev => [...prev, created]);
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
      await serviceTypeService.delete(id);
      setServiceTypes(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Failed to delete service type.');
    }
    setConfirmDel(null);
  };

  const getRevenue = (svcId) =>
    clientServices.filter(cs => cs.serviceId === svcId && cs.status === 'active').reduce((s, cs) => s + cs.monthlyAmount, 0);

  return (
    <div className="fade-in">
      <PageHeader
        title="Services"
        sub="Master catalogue of service types offered by your agency"
        action={isManagement && <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Service Type</Btn>}
      />

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height:140, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)' }}/>)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:14 }}>
          {serviceTypes.map(s => {
            const revenue = getRevenue(s.id);
            return (
              <Card key={s.id} style={{ padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${s.color}18`, border:`1.5px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                      <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>
                        {clientServices.filter(cs => cs.serviceId === s.id).length} assignment{clientServices.filter(cs => cs.serviceId === s.id).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  {isManagement && <ActionMenu onEdit={() => openEdit(s)} onDelete={() => setConfirmDel(s.id)}/>}
                </div>
                <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, marginBottom:12, minHeight:36 }}>{s.description}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontSize:14, color:'var(--text-muted)' }}>{clientServices.filter(cs=>cs.serviceId===s.id).length} client{clientServices.filter(cs=>cs.serviceId===s.id).length!==1?'s':''}</span>
                  {revenue > 0 && <span style={{ fontWeight:700, fontSize:14, color:'var(--success)' }}>{formatCurrency(revenue)}/mo</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {!loading && serviceTypes.length === 0 && <EmptyState message="No service types defined yet."/>}

      {showModal && (
        <Modal title={editing ? 'Edit Service Type' : 'New Service Type'} onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Saving…':editing?'Save':'Create'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14 }}>{errors.api}</div>}
            <Field label="Service Name" required error={errors.name}>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Email Marketing" style={inputStyle(errors.name)}/>
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} style={{...inputStyle(), resize:'vertical'}} placeholder="Brief description…"/>
            </Field>
            <Field label="Icon">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {ICONS.map(ic => <div key={ic} onClick={() => setForm(f=>({...f,icon:ic}))} style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer', background: form.icon===ic?'var(--accent-dim)':'var(--bg-elevated)', border:`2px solid ${form.icon===ic?'#2E6DB4':'transparent'}` }}>{ic}</div>)}
              </div>
            </Field>
            <Field label="Colour">
              <div style={{ display:'flex', gap:8 }}>
                {COLOR_OPTS.map(c => <div key={c} onClick={() => setForm(f=>({...f,color:c}))} style={{ width:26, height:26, borderRadius:7, background:c, cursor:'pointer', border: form.color===c?'3px solid var(--text)':'2px solid transparent', boxSizing:'border-box' }}/>)}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Delete this service type?" onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}
