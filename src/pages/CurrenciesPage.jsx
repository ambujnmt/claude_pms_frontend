import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, PageHeader, Btn, Modal, Field, inputStyle, ConfirmModal, ActionMenu, Table, TR, TD, Badge, EmptyState } from '../components/UI';
import { Plus, Star, Globe } from 'lucide-react';
import currencyService from '../services/currencyService';

const EMPTY = { name:'', code:'', symbol:'', symbolPosition:'prefix', decimalPlaces:2, thousandsSeparator:',', decimalSeparator:'.', useLakhSystem:false, isActive:true };

export default function CurrenciesPage() {
  const { currencies, setCurrencies, activeCurrency, setActiveCurrency, addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency, isManagement } = useApp();

  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Load on mount ─────────────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { list, default: def } = await currencyService.getAll();
        setCurrencies(list);
        if (def) setActiveCurrency(def);
      } catch {
        console.error('Failed to load currencies');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ name:c.name, code:c.code, symbol:c.symbol, symbolPosition:c.symbolPosition, decimalPlaces:c.decimalPlaces, thousandsSeparator:c.thousandsSeparator, decimalSeparator:c.decimalSeparator, useLakhSystem:c.useLakhSystem, isActive:c.isActive });
    setEditing(c.id); setErrors({}); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name   = 'Required';
    if (!form.code.trim())   e.code   = 'Required';
    if (!form.symbol.trim()) e.symbol = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await currencyService.update(editing, form);
        updateCurrency(editing, updated);
      } else {
        const created = await currencyService.create(form);
        addCurrency(created);
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save.';
      setErrors({ api: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await currencyService.delete(id);
      deleteCurrency(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
    setConfirmDel(null);
  };

  const handleSetDefault = async (currency) => {
    try {
      const updated = await currencyService.setDefault(currency.id);
      setDefaultCurrency(updated);
    } catch {
      alert('Failed to set default currency.');
    }
  };

  /* Preview formatter */
  const preview = (c) => {
    const num = c.useLakhSystem ? '1.5L' : '1.5K';
    return c.symbolPosition === 'suffix' ? `${num}${c.symbol}` : `${c.symbol}${num}`;
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Currencies"
        sub="Manage currencies used across the system. The default currency is applied to all amount displays."
        action={isManagement && <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Currency</Btn>}
      />

      {/* Active currency banner */}
      <div style={{ padding:'12px 18px', borderRadius:10, background:'#EDF4FB', border:'1.5px solid #2E6DB4', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:9, background:'#2E6DB4', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, flexShrink:0 }}>
          {activeCurrency.symbol}
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:'#1B2E6B' }}>{activeCurrency.name} ({activeCurrency.code}) — Active Currency</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
            Symbol: <strong>{activeCurrency.symbol}</strong> · Position: <strong>{activeCurrency.symbolPosition}</strong> · Format: <strong>{activeCurrency.useLakhSystem ? 'Lakh system (L, K)' : 'International (M, K)'}</strong>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
        <Table headers={['Currency','Code','Symbol','Position','Format','Preview','Default','Status', isManagement?'Actions':'']}>
          {loading && <TR><td colSpan={9} style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading…</td></TR>}
          {!loading && currencies.length === 0 && <TR><td colSpan={9} style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>No currencies found.</td></TR>}
          {currencies.map(c => (
            <TR key={c.id} highlighted={c.isDefault}>
              <TD>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {c.isDefault && <Star size={13} fill="#2E6DB4" color="#2E6DB4"/>}
                  <span style={{ fontWeight:600 }}>{c.name}</span>
                </div>
              </TD>
              <TD><Badge label={c.code} color="#1B2E6B"/></TD>
              <TD><span style={{ fontSize:18, fontWeight:700 }}>{c.symbol}</span></TD>
              <TD><span style={{ color:'var(--text-muted)', textTransform:'capitalize' }}>{c.symbolPosition}</span></TD>
              <TD><span style={{ color:'var(--text-muted)' }}>{c.useLakhSystem ? 'Lakh (L, K, Cr)' : 'International (M, K)'}</span></TD>
              <TD><span style={{ fontWeight:700, color:'#2E6DB4', fontSize:15 }}>{preview(c)}</span></TD>
              <TD>
                {c.isDefault
                  ? <Badge label="Default" color="var(--success)"/>
                  : isManagement && <button onClick={() => handleSetDefault(c)} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #2E6DB4', background:'transparent', color:'#2E6DB4', fontSize:12, fontWeight:600, cursor:'pointer' }}>Set Default</button>
                }
              </TD>
              <TD><Badge label={c.isActive?'Active':'Inactive'} color={c.isActive?'var(--success)':'var(--text-muted)'}/></TD>
              {isManagement && <TD><ActionMenu onEdit={() => openEdit(c)} onDelete={() => !c.isDefault && setConfirmDel(c.id)}/></TD>}
            </TR>
          ))}
        </Table>
      </Card>

      {/* Info box */}
      <Card style={{ padding:'16px 20px', background:'#F4F7FC' }}>
        <div style={{ fontWeight:700, fontSize:14, color:'#1B2E6B', marginBottom:8 }}>How currency works</div>
        <div style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.8 }}>
          • The <strong>default currency</strong> is used to display all amounts across the entire application.<br/>
          • Click <strong>Set Default</strong> on any currency to switch the display across all pages instantly.<br/>
          • <strong>Lakh system</strong> formats amounts as: ₹1.5L (1,50,000), ₹50K (50,000), ₹2.5Cr (2,50,00,000).<br/>
          • <strong>International system</strong> formats as: $1.5M, $50K.
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing?'Edit Currency':'Add Currency'} subtitle="Currency settings for amount display" onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Saving…':editing?'Save':'Add Currency'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:14 }}>{errors.api}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Currency Name" required error={errors.name}>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Indian Rupee" style={inputStyle(errors.name)}/>
              </Field>
              <Field label="Currency Code" required error={errors.code}>
                <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. INR" maxLength={10} style={inputStyle(errors.code)}/>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Symbol" required error={errors.symbol}>
                <input value={form.symbol} onChange={e => set('symbol', e.target.value)} placeholder="e.g. ₹" maxLength={10} style={inputStyle(errors.symbol)}/>
              </Field>
              <Field label="Symbol Position">
                <select value={form.symbolPosition} onChange={e => set('symbolPosition', e.target.value)} style={inputStyle()}>
                  <option value="prefix">Prefix (₹100)</option>
                  <option value="suffix">Suffix (100€)</option>
                </select>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="Decimal Places">
                <input type="number" min={0} max={4} value={form.decimalPlaces} onChange={e => set('decimalPlaces', parseInt(e.target.value))} style={inputStyle()}/>
              </Field>
              <Field label="Thousands Separator">
                <input value={form.thousandsSeparator} onChange={e => set('thousandsSeparator', e.target.value)} maxLength={5} style={inputStyle()}/>
              </Field>
              <Field label="Decimal Separator">
                <input value={form.decimalSeparator} onChange={e => set('decimalSeparator', e.target.value)} maxLength={5} style={inputStyle()}/>
              </Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Number Format">
                <select value={form.useLakhSystem ? 'lakh' : 'intl'} onChange={e => set('useLakhSystem', e.target.value === 'lakh')} style={inputStyle()}>
                  <option value="intl">International (1.5M, 50K)</option>
                  <option value="lakh">Lakh System (1.5L, 50K, 2.5Cr)</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            {/* Live preview */}
            <div style={{ padding:'12px 16px', borderRadius:8, background:'#EDF4FB', border:'1px solid #2E6DB4' }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Live Preview</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#2E6DB4' }}>{preview(form)}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Sample: 1,500 → {preview({ ...form, useLakhSystem: form.useLakhSystem })}</div>
            </div>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal message="Delete this currency? This cannot be undone." onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)}/>
      )}
    </div>
  );
}
