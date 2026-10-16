import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Card, Badge, Btn, Modal, Field, inputStyle, ConfirmModal, formatDate,
  PageHeader, Table, TR, TD, ActionMenu, EmptyState,
} from '../components/UI';
import { Globe, AlertTriangle, Clock, RefreshCw, Plus, Search } from 'lucide-react';
import domainService from '../services/domainService';

const REGISTRARS = ['GoDaddy', 'Namecheap', 'BigRock', 'Hostinger', 'Google Domains / Squarespace', 'Cloudflare', 'Other'];
const EMPTY = { domain:'', clientId:'', registrar:'', dnsProvider:'', registeredOn:'', expiresOn:'', autoRenew:false, nameservers:'', renewalAmount:'', currencyId:'', status:'active', notes:'' };

/* expiry state is derived from the date, so it can never go stale */
function expiryState(d) {
  const n = d.daysToExpiry;
  if (n === null || n === undefined) return { key:'unknown', label:'—', color:'var(--text-muted)' };
  if (n < 0)   return { key:'expired',  label:`Expired ${-n}d ago`, color:'var(--danger)' };
  if (n <= 30) return { key:'expiring', label: n === 0 ? 'Expires today' : `${n}d left`, color:'var(--warning)' };
  return { key:'ok', label:`${n}d left`, color:'var(--success)' };
}

export default function DomainsPage() {
  const { clients, currencies, activeCurrency, fmtFor, fmtSum } = useApp();

  const [domains, setDomains]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState('');
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');     // all | expiring | expired | auto
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true); setLoadErr('');
    try { setDomains(await domainService.getAll()); }
    catch { setLoadErr('Could not load domains.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total:    domains.length,
    expiring: domains.filter(d => expiryState(d).key === 'expiring').length,
    expired:  domains.filter(d => expiryState(d).key === 'expired').length,
    auto:     domains.filter(d => d.autoRenew).length,
  }), [domains]);

  const filtered = domains.filter(d => {
    const q = search.toLowerCase();
    const ms = !q || d.domain.toLowerCase().includes(q) || (d.clientName || '').toLowerCase().includes(q) || (d.registrar || '').toLowerCase().includes(q);
    const st = expiryState(d).key;
    const mf = filter === 'all' || (filter === 'expiring' && st === 'expiring') || (filter === 'expired' && st === 'expired') || (filter === 'auto' && d.autoRenew);
    return ms && mf;
  });

  const openAdd = () => { setForm({ ...EMPTY, currencyId: activeCurrency?.id || '' }); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (d) => {
    setForm({
      domain: d.domain, clientId: d.clientId || '', registrar: d.registrar || '', dnsProvider: d.dnsProvider || '',
      registeredOn: d.registeredOn || '', expiresOn: d.expiresOn || '', autoRenew: !!d.autoRenew, nameservers: d.nameservers || '',
      renewalAmount: d.renewalAmount ?? '', currencyId: d.currencyId || activeCurrency?.id || '', status: d.status || 'active', notes: d.notes || '',
    });
    setEditing(d.id); setErrors({}); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    const dom = form.domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!dom) e.domain = 'Required';
    else if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(dom)) e.domain = 'Enter a valid domain, e.g. example.com';
    if (!form.expiresOn) e.expiresOn = 'Required';
    if (form.registeredOn && form.expiresOn && form.expiresOn < form.registeredOn) e.expiresOn = 'Cannot be before the registration date';
    if (form.renewalAmount !== '' && Number(form.renewalAmount) < 0) e.renewalAmount = 'Cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await domainService.update(editing, form);
        setDomains(prev => prev.map(d => d.id === editing ? updated : d));
      } else {
        const created = await domainService.create(form);
        setDomains(prev => [...prev, created].sort((a, b) => (a.expiresOn || '').localeCompare(b.expiresOn || '')));
      }
      setShowModal(false);
    } catch (err) {
      const fe = err.response?.data?.errors;
      if (fe) {
        const map = { domain:'domain', expires_on:'expiresOn', registered_on:'registeredOn', renewal_amount:'renewalAmount' };
        const out = {}; const rest = [];
        Object.entries(fe).forEach(([k, v]) => { if (map[k]) out[map[k]] = v[0]; else rest.push(v[0]); });
        if (rest.length) out.api = rest.join(' ');
        setErrors(out);
      } else setErrors({ api: err.response?.data?.message || 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await domainService.delete(confirmDel); setDomains(prev => prev.filter(d => d.id !== confirmDel)); }
    catch { alert('Failed to delete domain.'); }
    setConfirmDel(null);
  };

  const KPIS = [
    { icon:<Globe size={16}/>,         label:'Total Domains',    value:stats.total,    color:'#1B2E6B', bg:'#EEF2FA', f:'all' },
    { icon:<Clock size={16}/>,         label:'Expiring ≤ 30 days', value:stats.expiring, color:'#8B5E0A', bg:'#FBF5EC', f:'expiring' },
    { icon:<AlertTriangle size={16}/>, label:'Expired',          value:stats.expired,  color:'#9B1C1C', bg:'#FEF2F2', f:'expired' },
    { icon:<RefreshCw size={16}/>,     label:'Auto-renew On',    value:stats.auto,     color:'#1A6B3C', bg:'#EDF7F2', f:'auto' },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        sub={`${domains.length} domain${domains.length !== 1 ? 's' : ''} · yearly renewal cost ${fmtSum(domains, d => d.renewalAmount)}`}
        action={<Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Domain</Btn>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {KPIS.map(k => (
          <Card key={k.label} onClick={() => setFilter(f => f === k.f ? 'all' : k.f)} style={{ display:'flex', alignItems:'center', gap:12, padding:14, outline: filter === k.f && k.f !== 'all' ? `2px solid ${k.color}` : 'none' }}>
            <div style={{ width:36, height:36, borderRadius:9, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', color:k.color, flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{k.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 260px', maxWidth:360 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:11, color:'var(--text-muted)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search domain, client or registrar…" style={{ ...inputStyle(), paddingLeft:32 }}/>
        </div>
        {filter !== 'all' && <Btn variant="ghost" size="sm" onClick={() => setFilter('all')}>Clear filter ×</Btn>}
      </div>

      <Card style={{ padding:0, overflow:'hidden' }}>
        {loading ? <div style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading domains…</div>
        : loadErr ? <div style={{ padding:28, textAlign:'center', color:'var(--danger)', fontSize:14 }}>{loadErr} <span style={{ cursor:'pointer', textDecoration:'underline' }} onClick={load}>Retry</span></div>
        : filtered.length === 0 ? <EmptyState icon="🌐" message={domains.length ? 'No domains match the filter.' : 'No domains yet. Add your first domain.'}/>
        : (
          <Table headers={['Domain','Client','Registrar','Expires','Time left','Auto-renew','Renewal cost','Status','Actions']}>
            {filtered.map(d => {
              const st = expiryState(d);
              return (
                <TR key={d.id}>
                  <TD><span style={{ fontWeight:700, color:'#1B2E6B' }}>{d.domain}</span></TD>
                  <TD>{d.clientName || <span style={{ color:'var(--text-muted)' }}>—</span>}</TD>
                  <TD><span style={{ color:'var(--text-muted)' }}>{d.registrar || '—'}</span></TD>
                  <TD>{formatDate(d.expiresOn)}</TD>
                  <TD><Badge label={st.label} color={st.color}/></TD>
                  <TD>{d.autoRenew ? <Badge label="On" color="var(--success)"/> : <Badge label="Off" color="var(--text-muted)"/>}</TD>
                  <TD><span style={{ fontWeight:700 }}>{fmtFor(d, d.renewalAmount)}</span></TD>
                  <TD><Badge label={d.status === 'inactive' ? 'Inactive' : 'Active'} color={d.status === 'inactive' ? 'var(--text-muted)' : 'var(--success)'}/></TD>
                  <TD><ActionMenu onEdit={() => openEdit(d)} onDelete={() => setConfirmDel(d.id)}/></TD>
                </TR>
              );
            })}
          </Table>
        )}
      </Card>

      {showModal && (
        <Modal title={editing ? 'Edit Domain' : 'Add Domain'} subtitle="Registration, renewal and DNS details" onClose={() => setShowModal(false)} width={640}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Domain'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{errors.api}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Domain" required error={errors.domain}>
                <input value={form.domain} onChange={e => set('domain', e.target.value)} placeholder="example.com" style={inputStyle(errors.domain)} autoFocus/>
              </Field>
              <Field label="Client">
                <select value={form.clientId} onChange={e => set('clientId', e.target.value)} style={inputStyle()}>
                  <option value="">— Internal / none —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Registrar">
                <input list="registrars" value={form.registrar} onChange={e => set('registrar', e.target.value)} placeholder="e.g. GoDaddy" style={inputStyle()}/>
                <datalist id="registrars">{REGISTRARS.map(r => <option key={r} value={r}/>)}</datalist>
              </Field>
              <Field label="DNS Provider">
                <input value={form.dnsProvider} onChange={e => set('dnsProvider', e.target.value)} placeholder="e.g. Cloudflare" style={inputStyle()}/>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Registered On">
                <input type="date" value={form.registeredOn} onChange={e => set('registeredOn', e.target.value)} style={inputStyle()}/>
              </Field>
              <Field label="Expires On" required error={errors.expiresOn}>
                <input type="date" value={form.expiresOn} onChange={e => set('expiresOn', e.target.value)} style={inputStyle(errors.expiresOn)}/>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Renewal Amount" error={errors.renewalAmount}>
                <input type="number" min="0" value={form.renewalAmount} onChange={e => set('renewalAmount', e.target.value)} placeholder="e.g. 1200" style={inputStyle(errors.renewalAmount)}/>
              </Field>
              <Field label="Currency">
                <select value={form.currencyId} onChange={e => set('currencyId', e.target.value)} style={inputStyle()}>
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer' }}>
              <input type="checkbox" checked={form.autoRenew} onChange={e => set('autoRenew', e.target.checked)}/> Auto-renew is enabled at the registrar
            </label>

            <Field label="Nameservers">
              <textarea value={form.nameservers} onChange={e => set('nameservers', e.target.value)} rows={2} placeholder={'ns1.example.com\nns2.example.com'} style={{ ...inputStyle(), resize:'vertical' }}/>
            </Field>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inputStyle(), resize:'vertical' }}/>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="Delete this domain record?" onConfirm={handleDelete} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}
