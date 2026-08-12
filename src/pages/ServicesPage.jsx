import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Btn, Modal, Field, inputStyle, ConfirmModal, formatCurrency, EmptyState, PageHeader, ActionMenu } from '../components/UI';
import { Plus } from 'lucide-react';

const COLOR_OPTS = ['#1B2E6B','#5B3FA6','#0D6E6E','#1A6B3C','#92520A','#B05A12','#A01C1C'];
const ICONS = ['💻','📱','🤖','🔍','📣','📲','🖥️','✍️','🎨','📊','🔧','📧','🌐','🎯','📈'];
const EMPTY = { name: '', icon: '💻', color: '#1B2E6B', description: '' };

export default function ServicesPage() { const { serviceTypes, clientServices, addServiceType, updateServiceType, deleteServiceType, isManagement } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, icon: s.icon, color: s.color, description: s.description }); setEditing(s.id); setErrors({}); setShowModal(true); };

  const handleSave = () => { if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    editing ? updateServiceType(editing, form) : addServiceType(form);
    setShowModal(false);
  };

  const getUsageCount = (svcId) => clientServices.filter(cs => cs.serviceId === svcId).length;
  const getActiveRevenue = (svcId) => clientServices.filter(cs => cs.serviceId === svcId && cs.status === 'active').reduce((s, cs) => s + cs.monthlyAmount, 0);

  return (
    <div className="fade-in">
      <PageHeader
        title="Services"
        sub="Master catalogue of service types offered by your agency"
        action={isManagement && <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Service Type</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {serviceTypes.map(s => { const usage   = getUsageCount(s.id);
          const revenue = getActiveRevenue(s.id);
          return (
            <Card key={s.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, border: `1.5px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{usage} active assignment{usage !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                {isManagement && <ActionMenu onEdit={() => openEdit(s)} onDelete={() => setConfirmDel(s.id)} />}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12, minHeight: 38 }}>{s.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{usage} client{usage !== 1 ? 's' : ''} using this</span>
                {revenue > 0 && <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>{formatCurrency(revenue)}/mo</span>}
              </div>
            </Card>
          );
        })}
      </div>
      {!serviceTypes.length && <EmptyState message="No service types defined yet." />}

      {/* Monthly revenue summary */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, marginBottom: 14 }}>Recurring Revenue by Service</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {serviceTypes.filter(s => getActiveRevenue(s.id) > 0).sort((a, b) => getActiveRevenue(b.id) - getActiveRevenue(a.id)).map(s => (
            <Card key={s.id} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.name}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(getActiveRevenue(s.id))}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>per month</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Service Type' : 'New Service Type'} onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave}>{editing ? 'Save' : 'Create'}</Btn></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Service Name" required error={errors.name}>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Email Marketing" style={inputStyle(errors.name)} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} style={{ ...inputStyle(), resize: 'vertical' }} placeholder="Brief description of this service…" />
            </Field>
            <Field label="Icon">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ICONS.map(ic => (
                  <div key={ic} onClick={() => setForm(f => ({...f, icon: ic}))} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', background: form.icon === ic ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `2px solid ${form.icon === ic ? 'var(--accent)' : 'transparent'}` }}>{ic}</div>
                ))}
              </div>
            </Field>
            <Field label="Colour">
              <div style={{ display: 'flex', gap: 8 }}>
                {COLOR_OPTS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({...f, color: c}))} style={{ width: 26, height: 26, borderRadius: 7, background: c, cursor: 'pointer', border: form.color === c ? '3px solid var(--text)' : '2px solid transparent', boxSizing: 'border-box' }} />
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal message="Delete this service type? It will be removed from the catalogue but existing client assignments remain." onConfirm={() => { deleteServiceType(confirmDel); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  );
}
