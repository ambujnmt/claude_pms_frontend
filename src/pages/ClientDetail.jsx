import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card, Badge, StatusBadge, ProgressBar, Btn, Modal, Field,
  inputStyle, ConfirmModal, ActionMenu, formatDate, EmptyState, SectionTitle,
  formatAmount, calcRenewalDate,
} from '../components/UI';
import ResourcePicker from '../components/ResourcePicker';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Globe,
  FolderKanban, Wrench, Server, Edit2, Plus, Trash2,
} from 'lucide-react';
import clientService, { mapClientErrors }     from '../services/clientService';
import clientServiceApi  from '../services/clientServiceApi';
import { validateClientForm, normalizeWebsite } from '../utils/clientValidation';
import { projectTypeOf } from '../utils/projectTypes';

const TABS = [
  { key: 'overview',  label: 'Overview',     icon: Building2 },
  { key: 'projects',  label: 'Projects',     icon: FolderKanban },
  { key: 'services',  label: 'Services',     icon: Wrench },
  { key: 'hosting',   label: 'Hosting',      icon: Server },
];

const INDUSTRIES = ['E-Commerce','Healthcare','Fintech','Retail','Logistics','Real Estate','HR Tech','Manufacturing','Education','Other'];
const CONTRACT_TYPES = ['Development Maintenance','SEO','PPC Management','Social Media','Hosting & Support','Content Marketing','UI/UX Retainer','AI/ML Maintenance','Other'];
const BILLING_CYCLES = ['monthly','quarterly','annual'];
const BD_ROLES = ['bd', 'management', 'super_admin'];
const PAYMENT_METHODS = ['Bank Transfer','PayPal','Stripe','Credit Card','Wire Transfer','Cheque','Other'];

export default function ClientDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const {
    clients, setClients,
    projects,
    clientServices, setClientServices,
    hostingProjects,
    serviceTypes,
    currencies, activeCurrency, users,
    fmtFor, fmtSum, canManage, canViewFinance, canEditClients,
  } = useApp();

  const [tab, setTab]       = useState('overview');
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  /* Edit client modal */
  const [showEdit, setShowEdit]     = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  /* Service modal */
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [svcForm, setSvcForm]           = useState({});
  const [svcEditing, setSvcEditing]     = useState(null);
  const [svcSaving, setSvcSaving]       = useState(false);
  const [svcErrors, setSvcErrors]       = useState({});
  const [confirmDelSvc, setConfirmDelSvc] = useState(null);

  const numId = parseInt(id) || id;

  /* ── Load client ─────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try context first
        let found = clients.find(c => c.id === numId || c.id === id);
        if (!found) {
          // Fetch from API
          found = await clientService.getById(id);
        }
        setClient(found);
      } catch {
        setError('Client not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Derived data ─────────────────────────────────────── */
  const clientProjects = projects.filter(p =>
    parseInt(p.clientId) === numId || p.clientId === id || p.clientId === numId
  );
  const clientSvcs = clientServices.filter(cs =>
    parseInt(cs.clientId) === numId || cs.clientId === id || cs.clientId === numId
  );
  const clientHosting = hostingProjects.filter(h =>
    parseInt(h.clientId) === numId || h.clientId === id || h.clientId === numId
  );
  const activeProjectsCount = clientProjects.filter(p => p.status === 'active').length;

  /* Web Project · Mobile Project · Digital Project (Digital = digital-category projects + this client's contracts) */
  const typedProjects = { web: [], mobile: [], digital: [] };
  clientProjects.forEach(p => typedProjects[projectTypeOf(p.category)].push(p));
  const CATEGORY_BLOCKS = [
    { key:'web',     title:'Web Project',     color:'#1B2E6B', list: typedProjects.web,     contracts: [] },
    { key:'mobile',  title:'Mobile Project',  color:'#2E6DB4', list: typedProjects.mobile,  contracts: [] },
    { key:'digital', title:'Digital Project', color:'#1A6B3C', list: typedProjects.digital, contracts: clientSvcs },
  ].map(b => ({ ...b, count: b.list.length + b.contracts.length,
                active: b.list.filter(p => p.status === 'active').length + b.contracts.filter(c => c.status === 'active').length }));
  const monthlyRevenue = fmtSum(clientSvcs.filter(cs => cs.status === 'active'), cs => cs.monthlyAmount);
  const totalBudget = fmtSum(clientProjects, p => p.budget);

  /* ── Edit client ─────────────────────────────────────── */
  const openEditClient = () => {
    setEditForm({
      name:          client.name          || '',
      contactPerson: client.contactPerson || '',
      email:         client.email         || '',
      alternateEmail: client.alternateEmail || '',
      website:       client.website       || '',
      phone:         client.phone         || '',
      alternatePhone: client.alternatePhone || '',
      address:       client.address       || '',
      city:          client.city          || '',
      industry:      client.industry      || '',
      status:        client.status        || 'active',
      notes:         client.notes         || '',
    });
    setEditErrors({});
    setShowEdit(true);
  };

  const handleSaveClient = async () => {
    const ve = validateClientForm(editForm);
    if (Object.keys(ve).length) { setEditErrors(ve); return; }
    setEditSaving(true);
    try {
      const updated = await clientService.update(client.id, editForm);
      setClient(updated);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      setShowEdit(false);
    } catch (err) {
      setEditErrors(mapClientErrors(err));
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Services CRUD ───────────────────────────────────── */
  const EMPTY_SVC = { bdOwner:'', resources:[], serviceId:'', name:'', contractType:'SEO', monthlyAmount:'', currencyId:'', billingCycle:'monthly', paymentMethod:'', status:'active', startDate:'', renewalDate:'', reportingDay:'', notes:'' };

  const openAddSvc = () => {
    setSvcForm({ ...EMPTY_SVC, clientId: client.id });
    setSvcEditing(null); setSvcErrors({}); setShowSvcModal(true);
  };

  const openEditSvc = (cs) => {
    setSvcForm({
      clientId:      client.id,
      bdOwner:       cs.bdOwner       || '',
      resources:     cs.resourceIds   || [],
      serviceId:     cs.serviceId     || '',
      name:          cs.name          || '',
      contractType:  cs.contractType  || 'Other',
      monthlyAmount: cs.monthlyAmount || '',
      currencyId:    cs.currencyId    || '',
      billingCycle:  cs.billingCycle  || 'monthly',
      paymentMethod: cs.paymentMethod || '',
      status:        cs.status        || 'active',
      startDate:     cs.startDate     || '',
      renewalDate:   cs.renewalDate   || '',
      reportingDay:  cs.reportingDay  || '',
      notes:         cs.notes         || '',
    });
    setSvcEditing(cs.id); setSvcErrors({}); setShowSvcModal(true);
  };

  const handleSaveSvc = async () => {
    if (!svcForm.name?.trim())    { setSvcErrors({ name: 'Required' }); return; }
    if (!svcForm.monthlyAmount)   { setSvcErrors({ monthlyAmount: 'Required' }); return; }
    setSvcSaving(true);
    try {
      const payload = {
        ...svcForm,
        clientId:      parseInt(svcForm.clientId),
        serviceId:     svcForm.serviceId ? parseInt(svcForm.serviceId) : null,
        monthlyAmount: parseFloat(svcForm.monthlyAmount) || 0,
      };
      if (svcEditing) {
        const updated = await clientServiceApi.update(svcEditing, payload);
        setClientServices(prev => prev.map(cs => cs.id === svcEditing ? updated : cs));
      } else {
        const created = await clientServiceApi.create(payload);
        setClientServices(prev => [created, ...prev]);
      }
      setShowSvcModal(false);
    } catch (err) {
      setSvcErrors({ api: err.response?.data?.message || 'Failed to save.' });
    } finally {
      setSvcSaving(false);
    }
  };

  const handleDeleteSvc = async () => {
    try {
      await clientServiceApi.delete(confirmDelSvc);
      setClientServices(prev => prev.filter(cs => cs.id !== confirmDelSvc));
    } catch { alert('Failed to delete service.'); }
    setConfirmDelSvc(null);
  };

  /* ── Render states ───────────────────────────────────── */
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, color:'var(--text-muted)', fontSize:14 }}>
      Loading client details…
    </div>
  );

  if (error || !client) return (
    <div style={{ textAlign:'center', padding:40 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
      <div style={{ fontSize:16, color:'var(--text-muted)', marginBottom:20 }}>{error || 'Client not found.'}</div>
      <Btn onClick={() => navigate('/clients')}>← Back to Clients</Btn>
    </div>
  );

  const canEdit = canManage;
  const visibleTabs = TABS.filter(t => canViewFinance || t.key !== 'hosting');

  return (
    <div className="fade-in">

      {/* ── Back + Header ─────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/clients')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <ArrowLeft size={13}/> Clients
          </button>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'#1B2E6B', letterSpacing:'-0.5px', lineHeight:1.2 }}>{client.name}</h1>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
              <StatusBadge status={client.status}/>
              {client.industry && <Badge label={client.industry} color="#4C3A9E"/>}
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>Client since {formatDate(client.since || client.created_at)}</span>
            </div>
          </div>
        </div>
        {canEditClients && (
          <Btn icon={<Edit2 size={13}/>} onClick={openEditClient}>Edit Client</Btn>
        )}
      </div>

      {/* ── KPI strip ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${canViewFinance?4:2},1fr)`, gap:12, marginBottom:20 }}>
        {[
          { label:'Active Projects', value: activeProjectsCount, sub:`${clientProjects.length} total`,  color:'#1B2E6B', bg:'#EEF2FA' },
          ...(canViewFinance ? [
            { label:'Monthly Revenue', value: monthlyRevenue, sub:`${clientSvcs.filter(s=>s.status==='active').length} active services`, color:'var(--success)', bg:'#EDF7F2' },
            { label:'Total Budget',    value: totalBudget,    sub:'across all projects', color:'#2E6DB4', bg:'#EDF4FB' },
            { label:'Hosting Plans',   value: clientHosting.length, sub:`${clientHosting.filter(h=>h.status==='active').length} active`, color:'#4C3A9E', bg:'#F0EDFA' },
          ] : [
            { label:'Services', value: clientSvcs.length, sub:`${clientSvcs.filter(s=>s.status==='active').length} active`, color:'#4C3A9E', bg:'#F0EDFA' },
          ]),
        ].map(k => (
          <Card key={k.label} style={{ padding:'14px 16px', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:22, fontWeight:700, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginTop:4 }}>{k.label}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div style={{ display:'flex', gap:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:7, border:'none', cursor:'pointer', background:tab===key?'#1B2E6B':'transparent', color:tab===key?'#fff':'var(--text-muted)', fontSize:14, fontWeight:tab===key?700:400, transition:'all 0.13s', fontFamily:'var(--font-body)' }}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* Contact info */}
          <Card>
            <SectionTitle>Contact Information</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { icon: Building2, label:'Contact Person', value: client.contactPerson },
                { icon: Mail,      label:'Email',          value: client.email },
                { icon: Mail,      label:'Alternate Email', value: client.alternateEmail },
                { icon: Phone,     label:'Phone',          value: client.phone },
                { icon: Phone,     label:'Alternate Phone', value: client.alternatePhone },
                { icon: MapPin,    label:'City/Country',   value: client.city },
                { icon: MapPin,    label:'Address',        value: client.address },
                { icon: Globe,     label:'Industry',       value: client.industry },
              ].map(row => row.value ? (
                <div key={row.label} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:30, height:30, borderRadius:7, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <row.icon size={13} color="var(--text-muted)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>{row.label}</div>
                    <div style={{ fontSize:14, color:'var(--text)', marginTop:2 }}>{row.value}</div>
                  </div>
                </div>
              ) : null)}
              {client.website && (
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:30, height:30, borderRadius:7, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Globe size={13} color="var(--text-muted)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>Website</div>
                    <a href={normalizeWebsite(client.website)} target="_blank" rel="noreferrer" style={{ fontSize:14, color:'#2E6DB4', marginTop:2, display:'block' }}>{client.website}</a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <SectionTitle>Internal Notes</SectionTitle>
            {client.notes
              ? <p style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.8 }}>{client.notes}</p>
              : <EmptyState icon="📝" message="No notes added yet."/>
            }
          </Card>

          {/* Projects by category: Web · Mobile · Digital */}
          <Card style={{ gridColumn:'1 / -1' }}>
            <SectionTitle>Projects by Category</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:14 }}>
              {CATEGORY_BLOCKS.map(b => (
                <div key={b.key} style={{ border:'1px solid var(--border)', borderTop:`3px solid ${b.color}`, borderRadius:10, padding:'12px 14px', background:'var(--bg-card)' }}>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8, cursor:'pointer' }} onClick={() => setTab('projects')}>
                    <span style={{ fontSize:14, fontWeight:700, color:b.color }}>{b.title}</span>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}><strong style={{ fontSize:20, color:b.color }}>{b.count}</strong> · {b.active} active</span>
                  </div>
                  {b.count === 0
                    ? <div style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 0' }}>No {b.title.toLowerCase()}s yet.</div>
                    : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {b.list.slice(0,5).map(p => (
                          <div key={'p'+p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, background:'var(--bg-elevated)', cursor:'pointer' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.category} · {p.completion||0}%</div>
                            </div>
                            <StatusBadge status={p.status}/>
                          </div>
                        ))}
                        {b.contracts.slice(0,5).map(c => (
                          <div key={'c'+c.id} onClick={() => navigate(`/maintenance/${c.id}`)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, background:'var(--bg-elevated)', cursor:'pointer' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Contract{c.contractType ? ` · ${c.contractType}` : ''}</div>
                            </div>
                            <StatusBadge status={c.status}/>
                          </div>
                        ))}
                        {b.count > 5 && <div style={{ fontSize:12, color:'#2E6DB4', cursor:'pointer', paddingTop:2 }} onClick={() => setTab('projects')}>View all {b.count} →</div>}
                      </div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══ PROJECTS TAB ════════════════════════════════ */}
      {tab === 'projects' && (
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
          {CATEGORY_BLOCKS.map(b => (
            <div key={b.key}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:4, height:20, borderRadius:3, background:b.color }}/>
                <span style={{ fontSize:16, fontWeight:700, color:b.color }}>{b.title}</span>
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>{b.count} total · {b.active} active</span>
              </div>
              {b.count === 0
                ? <Card style={{ padding:'14px 18px', fontSize:14, color:'var(--text-muted)' }}>No {b.title.toLowerCase()}s for this client yet.</Card>
                : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {b.list.map(p => (
                      <Card key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)} style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:4, height:48, borderRadius:4, background:p.color||'#2E6DB4', flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
                          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{p.category} · Due {formatDate(p.endDate)}</div>
                        </div>
                        <div style={{ minWidth:140 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Completion</span>
                            <span style={{ fontSize:12, fontWeight:700, color:p.color||'#2E6DB4' }}>{p.completion||0}%</span>
                          </div>
                          <ProgressBar value={p.completion||0} color={p.color||'#2E6DB4'} height={4}/>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, minWidth:100 }}>
                          <StatusBadge status={p.status}/>
                          {canViewFinance && <span style={{ fontSize:13, fontWeight:700, color:'var(--success)' }}>{fmtFor(p, p.budget)}</span>}
                        </div>
                      </Card>
                    ))}
                    {b.contracts.map(c => (
                      <Card key={'c'+c.id} hover onClick={() => navigate(`/maintenance/${c.id}`)} style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:4, height:48, borderRadius:4, background:b.color, flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:15 }}>{c.name}</div>
                          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>Contract{c.contractType ? ` · ${c.contractType}` : ''}{c.renewalDate ? ` · Renews ${formatDate(c.renewalDate)}` : ''}</div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, minWidth:100 }}>
                          <StatusBadge status={c.status}/>
                          {canViewFinance && <span style={{ fontSize:13, fontWeight:700, color:'var(--success)' }}>{fmtFor(c, c.monthlyAmount)}</span>}
                        </div>
                      </Card>
                    ))}
                  </div>}
            </div>
          ))}
        </div>
      )}

      {/* ══ SERVICES TAB ════════════════════════════════ */}
      {tab === 'services' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, color:'var(--text-muted)' }}>{clientSvcs.length} service contract{clientSvcs.length !== 1 ? 's' : ''}</div>
            {canEdit && <Btn icon={<Plus size={13}/>} onClick={openAddSvc}>Add Service</Btn>}
          </div>

          {clientSvcs.length === 0
            ? <EmptyState icon="🔧" message="No service contracts for this client."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {clientSvcs.map(cs => {
                  const svc = serviceTypes.find(s => s.id === cs.serviceId || s.id === parseInt(cs.serviceId));
                  return (
                    <Card key={cs.id} hover onClick={() => navigate(`/maintenance/${cs.id}`)} style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:9, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                        {svc?.icon || '🔧'}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{cs.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                          {cs.contractType} · {cs.billingCycle} billing
                          {cs.startDate ? ` · Started ${formatDate(cs.startDate)}` : ''}
                          {canViewFinance && cs.paymentMethod ? ` · ${cs.paymentMethod}` : ''}
                          {cs.reportingDay ? ` · Reports on the ${cs.reportingDay}${ordinalSuffix(cs.reportingDay)} of every month` : ''}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                        {canViewFinance && <span style={{ fontSize:18, fontWeight:700, color:'var(--success)' }}>{formatAmount(cs.monthlyAmount, cs.currency || activeCurrency)}<span style={{ fontSize:12, fontWeight:400, color:'var(--text-muted)' }}>/mo</span></span>}
                        <StatusBadge status={cs.status}/>
                      </div>
                      {canEdit && (
                        <ActionMenu
                          onEdit={() => openEditSvc(cs)}
                          onDelete={() => setConfirmDelSvc(cs.id)}
                        />
                      )}
                    </Card>
                  );
                })}
              </div>
            )
          }

          {/* Monthly total */}
          {canViewFinance && clientSvcs.length > 0 && (
            <Card style={{ marginTop:14, padding:'13px 18px', background:'#EDF4FB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, fontWeight:600, color:'#1B2E6B' }}>Total Monthly Revenue</span>
              <span style={{ fontSize:22, fontWeight:800, color:'var(--success)' }}>{monthlyRevenue}/mo</span>
            </Card>
          )}
        </div>
      )}

      {/* ══ HOSTING TAB ═════════════════════════════════ */}
      {tab === 'hosting' && canViewFinance && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {clientHosting.length === 0
            ? <EmptyState icon="🖥️" message="No hosting plans for this client."/>
            : clientHosting.map(h => (
              <Card key={h.id} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:9, background:'#EEF2FA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🖥️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{h.domain}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                    {h.plan} · {h.server} · Renewal {formatDate(h.renewalDate)}
                  </div>
                  {h.addons?.length > 0 && (
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5 }}>
                      {h.addons.map(a => <Badge key={a} label={a} color="#4C3A9E"/>)}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                  <span style={{ fontSize:16, fontWeight:700, color:'#2E6DB4' }}>{fmtSum([h], x => x.annualAmount)}/yr</span>
                  <StatusBadge status={h.status}/>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {/* ── Edit Client Modal ─────────────────────────── */}
      {showEdit && (
        <Modal title="Edit Client" onClose={() => setShowEdit(false)} width={560}
          footer={<><Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Btn><Btn onClick={handleSaveClient} disabled={editSaving}>{editSaving?'Saving…':'Save Changes'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {editErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{editErrors.api}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Company Name" required error={editErrors.name}>
                <input value={editForm.name||''} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} style={inputStyle(editErrors.name)} autoFocus/>
              </Field>
              <Field label="Contact Person" error={editErrors.contactPerson}>
                <input value={editForm.contactPerson||''} onChange={e => setEditForm(f=>({...f,contactPerson:e.target.value}))} style={inputStyle(editErrors.contactPerson)}/>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Email" error={editErrors.email}>
                <input type="text" inputMode="email" placeholder="name@company.com" value={editForm.email||''} onChange={e => setEditForm(f=>({...f,email:e.target.value}))} style={inputStyle(editErrors.email)}/>
              </Field>
              <Field label="Phone" error={editErrors.phone}>
                <input type="tel" placeholder="+91 98765 43210" value={editForm.phone||''} onChange={e => setEditForm(f=>({...f,phone:e.target.value}))} style={inputStyle(editErrors.phone)}/>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Alternate Email (optional)" error={editErrors.alternateEmail}>
                <input type="text" inputMode="email" value={editForm.alternateEmail||''} onChange={e => setEditForm(f=>({...f,alternateEmail:e.target.value}))} style={inputStyle(editErrors.alternateEmail)}/>
              </Field>
              <Field label="Alternate Phone (optional)" error={editErrors.alternatePhone}>
                <input type="tel" value={editForm.alternatePhone||''} onChange={e => setEditForm(f=>({...f,alternatePhone:e.target.value}))} style={inputStyle(editErrors.alternatePhone)}/>
              </Field>
            </div>
            <Field label="Website (optional)" error={editErrors.website}>
              <input type="text" inputMode="url" autoCapitalize="off" placeholder="example.com or https://www.example.com" value={editForm.website||''} onChange={e => setEditForm(f=>({...f,website:e.target.value}))} style={inputStyle(editErrors.website)}/>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="City/Country" error={editErrors.city}>
                <input value={editForm.city||''} onChange={e => setEditForm(f=>({...f,city:e.target.value}))} style={inputStyle(editErrors.city)}/>
              </Field>
              <Field label="Industry">
                <select value={editForm.industry||''} onChange={e => setEditForm(f=>({...f,industry:e.target.value}))} style={inputStyle()}>
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={editForm.status||'active'} onChange={e => setEditForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <Field label="Address (optional)" error={editErrors.address}>
              <textarea value={editForm.address||''} onChange={e => setEditForm(f=>({...f,address:e.target.value}))} rows={2} placeholder="Street, area, postal code…" style={{...inputStyle(), resize:'vertical'}}/>
            </Field>
            <Field label="Notes">
              <textarea value={editForm.notes||''} onChange={e => setEditForm(f=>({...f,notes:e.target.value}))} rows={3} style={{...inputStyle(), resize:'vertical'}}/>
            </Field>
          </div>
        </Modal>
      )}

      {/* ── Service Modal ─────────────────────────────── */}
      {showSvcModal && (
        <Modal title={svcEditing?'Edit Service Contract':'Add Service Contract'} onClose={() => setShowSvcModal(false)} width={560}
          footer={<><Btn variant="ghost" onClick={() => setShowSvcModal(false)}>Cancel</Btn><Btn onClick={handleSaveSvc} disabled={svcSaving}>{svcSaving?'Saving…':svcEditing?'Save Changes':'Add Service'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {svcErrors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{svcErrors.api}</div>}
            <Field label="Contract / Service Name" required error={svcErrors.name}>
              <input value={svcForm.name||''} onChange={e => setSvcForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Monthly SEO Retainer" style={inputStyle(svcErrors.name)} autoFocus/>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Contract Type">
                <select value={svcForm.contractType||'SEO'} onChange={e => setSvcForm(f=>({...f,contractType:e.target.value}))} style={inputStyle()}>
                  {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Service Catalogue">
                <select value={svcForm.serviceId||''} onChange={e => setSvcForm(f=>({...f,serviceId:e.target.value}))} style={inputStyle()}>
                  <option value="">None / Custom</option>
                  {serviceTypes.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Monthly Amount" required error={svcErrors.monthlyAmount}>
                <input type="number" value={svcForm.monthlyAmount||''} onChange={e => setSvcForm(f=>({...f,monthlyAmount:e.target.value}))} placeholder="15000" style={inputStyle(svcErrors.monthlyAmount)}/>
              </Field>
              <Field label="Currency">
                <select value={svcForm.currencyId||''} onChange={e => setSvcForm(f=>({...f,currencyId:e.target.value}))} style={inputStyle()}>
                  <option value="">Default ({activeCurrency?.code})</option>
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                </select>
              </Field>
              <Field label="Billing Cycle">
                <select value={svcForm.billingCycle||'monthly'} onChange={e => setSvcForm(f=>({...f,billingCycle:e.target.value,renewalDate:f.startDate?calcRenewalDate(f.startDate,e.target.value):f.renewalDate}))} style={inputStyle()}>
                  {BILLING_CYCLES.map(b => <option key={b} value={b} style={{textTransform:'capitalize'}}>{b}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Payment Method">
                <select value={svcForm.paymentMethod||''} onChange={e => setSvcForm(f=>({...f,paymentMethod:e.target.value}))} style={inputStyle()}>
                  <option value="">Select…</option>
                  {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={svcForm.status||'active'} onChange={e => setSvcForm(f=>({...f,status:e.target.value}))} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Start Date">
                <input type="date" value={svcForm.startDate||''} onChange={e => setSvcForm(f=>({...f,startDate:e.target.value,renewalDate:calcRenewalDate(e.target.value,f.billingCycle||'monthly')}))} style={inputStyle()}/>
              </Field>
              <Field label="Renewal Date (auto)">
                <input type="date" value={svcForm.renewalDate||''} onChange={e => setSvcForm(f=>({...f,renewalDate:e.target.value}))} style={inputStyle()}/>
              </Field>
              <Field label="Monthly Reporting Day">
                <input type="number" min={1} max={31} value={svcForm.reportingDay||''} onChange={e => setSvcForm(f=>({...f,reportingDay:e.target.value}))} placeholder="e.g. 5" style={inputStyle()}/>
              </Field>
            </div>
            <Field label="BD Owner">
              <select value={svcForm.bdOwner||''} onChange={e => setSvcForm(f=>({...f,bdOwner:e.target.value}))} style={inputStyle()}>
                <option value="">Unassigned</option>
                {users.filter(u => BD_ROLES.includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <ResourcePicker label="Resources (developers, designers, SEO, QA, etc.)" value={svcForm.resources||[]} onChange={v => setSvcForm(f=>({...f,resources:v}))} />
            <Field label="Notes">
              <textarea value={svcForm.notes||''} onChange={e => setSvcForm(f=>({...f,notes:e.target.value}))} rows={2} style={{...inputStyle(), resize:'vertical'}} placeholder="Scope details, SLA…"/>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDelSvc && (
        <ConfirmModal message="Remove this service contract?" onConfirm={handleDeleteSvc} onCancel={() => setConfirmDelSvc(null)}/>
      )}
    </div>
  );
}

function ordinalSuffix(day) {
  const n = parseInt(day);
  if (isNaN(n)) return '';
  if (n % 10 === 1 && n !== 11) return 'st';
  if (n % 10 === 2 && n !== 12) return 'nd';
  if (n % 10 === 3 && n !== 13) return 'rd';
  return 'th';
}
