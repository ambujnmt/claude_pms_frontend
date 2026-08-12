import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Badge, StatusBadge, Btn, Modal, Field, inputStyle, ConfirmModal, ProgressBar, formatCurrency, formatDate, SectionTitle, EmptyState, ActionMenu, Table, TR, TD } from '../components/UI';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Plus, Layers, FolderKanban, Server } from 'lucide-react';

const CS_EMPTY = { serviceId: '', name: '', monthlyAmount: '', billingCycle: 'monthly', status: 'active', startDate: '', notes: '' };

export default function ClientDetail() { const { id } = useParams();
  const navigate = useNavigate();
  const { clients, projects, clientServices, hostingProjects, serviceTypes, addClientService, updateClientService, deleteClientService, updateClient, isManagement, isBD } = useApp();
  const client = clients.find(c => c.id === id);
  const [tab, setTab] = useState('overview');
  const [showCSModal, setShowCSModal] = useState(false);
  const [csForm, setCSForm] = useState(CS_EMPTY);
  const [editingCS, setEditingCS] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  if (!client) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Client not found. <button onClick={() => navigate('/clients')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button></div>;

  const cProjects = projects.filter(p => p.clientId === id);
  const cServices = clientServices.filter(cs => cs.clientId === id);
  const cHosting  = hostingProjects.filter(h => h.clientId === id);
  const monthlyRev = cServices.filter(cs => cs.status === 'active').reduce((s, cs) => s + cs.monthlyAmount, 0);
  const totalDev  = cProjects.reduce((s, p) => s + p.budget, 0);
  const hostingRev = cHosting.reduce((s, h) => s + h.annualAmount / 12, 0);

  const openAddCS = () => { setCSForm(CS_EMPTY); setEditingCS(null); setShowCSModal(true); };
  const openEditCS = (cs) => { setCSForm({ serviceId: cs.serviceId, name: cs.name, monthlyAmount: cs.monthlyAmount, billingCycle: cs.billingCycle, status: cs.status, startDate: cs.startDate, notes: cs.notes }); setEditingCS(cs.id); setShowCSModal(true); };
  const handleSaveCS = () => { const data = { ...csForm, clientId: id, monthlyAmount: parseInt(csForm.monthlyAmount) || 0 };
    editingCS ? updateClientService(editingCS, data) : addClientService(data);
    setShowCSModal(false);
  };

  const TABS = [{ k: 'overview', label: 'Overview' }, { k: 'projects', label: `Projects (${cProjects.length})` }, { k: 'services', label: `Services (${cServices.length})` }, { k: 'hosting', label: `Hosting (${cHosting.length})` }];

  return (
    <div className="fade-in">
      <button onClick={() => navigate('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontWeight: 700, marginBottom: 16 }}>
        <ArrowLeft size={13} /> Back to Clients
      </button>

      {/* Header */}
      <Card style={{ marginBottom: 18, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700 }}>{client.name}</h1>
              <StatusBadge status={client.status} />
              {client.industry && <Badge label={client.industry} color="var(--accent)" />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {[
                { icon: <Building2 size={12} />, val: client.contactPerson }, { icon: <Mail size={12} />, val: client.email }, { icon: <Phone size={12} />, val: client.phone }, { icon: <MapPin size={12} />, val: client.city }, ].map((item, i) => item.val ? (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>{item.val}
                </div>
              ) : null)}
            </div>
            {client.notes && <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>Note: {client.notes}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 20, alignItems: 'end' }}>
            {[
              { label: 'Dev Projects', val: cProjects.length, color: 'var(--accent)' }, { label: 'Active Services', val: cServices.filter(c => c.status==='active').length, color: 'var(--violet)' }, { label: 'Monthly Revenue', val: formatCurrency(monthlyRev + hostingRev), color: 'var(--success)' }, { label: 'Total Dev Budget', val: formatCurrency(totalDev), color: 'var(--warning)' }, ].map(s => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)' }}>Client since {formatDate(client.since)}</div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: tab === t.k ? 'var(--accent)' : 'transparent', color: tab === t.k ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: tab === t.k ? 700 : 400, cursor: 'pointer', transition: 'all 0.13s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card>
            <SectionTitle sub="Development work">Projects Summary</SectionTitle>
            {!cProjects.length && <EmptyState message="No development projects yet." />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cProjects.map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{formatCurrency(p.budget)} · {p.completion}% done</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Recurring services">Active Services</SectionTitle>
            {!cServices.length && <EmptyState message="No recurring services assigned." />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cServices.map(cs => { const svc = serviceTypes.find(s => s.id === cs.serviceId);
                return (
                  <div key={cs.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{svc?.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{cs.name}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{formatCurrency(cs.monthlyAmount)}/mo</div>
                    </div>
                    <StatusBadge status={cs.status} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Projects tab */}
      {tab === 'projects' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle sub="Development projects for this client">Projects</SectionTitle>
            {isBD && <Btn size="sm" icon={<Plus size={12} />} onClick={() => navigate('/projects')}>Add Project</Btn>}
          </div>
          {!cProjects.length && <EmptyState message="No projects yet." />}
          <Table headers={['Project', 'Category', 'Budget', 'Progress', 'Dates', 'Status', '']}>
            {cProjects.map(p => (
              <TR key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                <TD><div style={{ fontWeight: 700 }}>{p.name}</div></TD>
                <TD><Badge label={p.category} color={p.color} /></TD>
                <TD><span style={{ fontWeight: 700 }}>{formatCurrency(p.budget)}</span></TD>
                <TD style={{ minWidth: 140 }}><ProgressBar value={p.completion} color={p.color} height={4} showLabel bg="var(--bg-elevated)" /></TD>
                <TD><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{formatDate(p.endDate)}</span></TD>
                <TD><StatusBadge status={p.status} /></TD>
                <TD><span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>View →</span></TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle sub="Recurring services & retainers">Services</SectionTitle>
            {(isManagement || isBD) && <Btn size="sm" icon={<Plus size={12} />} onClick={openAddCS}>Add Service</Btn>}
          </div>
          {!cServices.length && <EmptyState message="No services assigned yet." />}
          <Table headers={['Service', 'Type', 'Monthly Amount', 'Billing', 'Start Date', 'Status', 'Notes', 'Actions']}>
            {cServices.map(cs => { const svc = serviceTypes.find(s => s.id === cs.serviceId);
              return (
                <TR key={cs.id}>
                  <TD><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span>{svc?.icon || '📋'}</span><span style={{ fontWeight: 700 }}>{cs.name}</span></div></TD>
                  <TD>{svc && <Badge label={svc.name} color={svc.color || 'var(--accent)'} />}</TD>
                  <TD><span style={{ fontWeight: 700 }}>{formatCurrency(cs.monthlyAmount)}</span></TD>
                  <TD><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{cs.billingCycle}</span></TD>
                  <TD><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{formatDate(cs.startDate)}</span></TD>
                  <TD><StatusBadge status={cs.status} /></TD>
                  <TD><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{cs.notes || '—'}</span></TD>
                  <TD>{(isManagement || isBD) && <ActionMenu onEdit={() => openEditCS(cs)} onDelete={() => setConfirmDel(cs.id)} />}</TD>
                </TR>
              );
            })}
          </Table>
        </Card>
      )}

      {/* Hosting tab */}
      {tab === 'hosting' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <SectionTitle sub="Hosting plans for this client">Hosting</SectionTitle>
          </div>
          {!cHosting.length && <EmptyState message="No hosting set up for this client." />}
          <Table headers={['Domain', 'Plan', 'Annual', 'Renewal', 'Status']}>
            {cHosting.map(h => (
              <TR key={h.id}>
                <TD><span style={{ fontSize: 14 }}>{h.domain}</span></TD>
                <TD><Badge label={h.plan} color="var(--accent)" /></TD>
                <TD><span style={{ fontWeight: 700 }}>{formatCurrency(h.annualAmount)}</span></TD>
                <TD><span style={{ fontSize: 14, }}>{formatDate(h.renewalDate)}</span></TD>
                <TD><StatusBadge status={h.status} /></TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      {/* Add/Edit Service Modal */}
      {showCSModal && (
        <Modal title={editingCS ? 'Edit Service' : 'Add Service to Client'} onClose={() => setShowCSModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowCSModal(false)}>Cancel</Btn><Btn onClick={handleSaveCS}>{editingCS ? 'Save' : 'Add Service'}</Btn></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Service Type">
              <select value={csForm.serviceId} onChange={e => setCSForm(f => ({...f, serviceId: e.target.value}))} style={inputStyle()}>
                <option value="">Select service type…</option>
                {serviceTypes.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </Field>
            <Field label="Service Name / Label">
              <input value={csForm.name} onChange={e => setCSForm(f => ({...f, name: e.target.value}))} placeholder="e.g. SEO – Homepage & Blog" style={inputStyle()} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Monthly Amount (₹)">
                <input type="number" value={csForm.monthlyAmount} onChange={e => setCSForm(f => ({...f, monthlyAmount: e.target.value}))} style={inputStyle()} />
              </Field>
              <Field label="Billing Cycle">
                <select value={csForm.billingCycle} onChange={e => setCSForm(f => ({...f, billingCycle: e.target.value}))} style={inputStyle()}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={csForm.status} onChange={e => setCSForm(f => ({...f, status: e.target.value}))} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
            </div>
            <Field label="Start Date"><input type="date" value={csForm.startDate} onChange={e => setCSForm(f => ({...f, startDate: e.target.value}))} style={inputStyle()} /></Field>
            <Field label="Notes"><textarea value={csForm.notes} onChange={e => setCSForm(f => ({...f, notes: e.target.value}))} rows={2} style={{ ...inputStyle(), resize: 'vertical' }} /></Field>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal message="Remove this service from the client?" onConfirm={() => { deleteClientService(confirmDel); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  );
}
