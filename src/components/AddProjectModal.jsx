import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal, Field, inputStyle, Btn } from './UI';
import { Plus, Trash2 } from 'lucide-react';
import { users, CATEGORIES } from '../data/mockData';

const EMPTY = { name:'', clientId:'', category: CATEGORIES.WEBSITE, budget:'', startDate:'', endDate:'', bdOwner:'', pmOwner:'', description:'', clientCommitment:'', color:'#1B4F72', milestones:[{name:'',dueDate:''}], payments:[{amount:'',date:'',type:'Advance',notes:''}] };
const COLORS = ['#1B2E6B','#2E6DB4','#4A90D9','#4C3A9E','#1A6B3C','#8B5E0A','#9B1C1C'];

export default function AddProjectModal() { const { setShowAddProject, addProject, user, clients } = useApp();
  const [form, setForm] = useState({ ...EMPTY, bdOwner: user.id });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => { const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.clientId) e.clientId = 'Select a client';
    if (!form.budget || isNaN(form.budget)) e.budget = 'Enter valid amount';
    if (!form.startDate) e.startDate = 'Required';
    if (!form.endDate) e.endDate = 'Required';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (!validate()) return;
    const client = clients.find(c => c.id === form.clientId);
    addProject({ ...form, client: client?.name || '', budget: parseInt(form.budget), milestones: form.milestones.filter(m => m.name.trim()), payments: form.payments.filter(p => p.amount && p.date).map((p, i) => ({ ...p, id: `pay_${Date.now()}_${i}`, amount: parseInt(p.amount), status: 'upcoming' })), });
    setShowAddProject(false);
  };

  const updM = (i, k, v) => setForm(f => ({ ...f, milestones: f.milestones.map((m, idx) => idx===i ? {...m,[k]:v} : m) }));
  const updP = (i, k, v) => setForm(f => ({ ...f, payments:  f.payments.map((p, idx)  => idx===i ? {...p,[k]:v} : p) }));

  const bds = users.filter(u => u.role === 'bd' || u.role === 'management');
  const pms = users.filter(u => u.role === 'pm' || u.role === 'management');

  const stepLabels = ['Project Details', 'Milestones', 'Payments'];

  return (
    <Modal title="Add New Project" subtitle="Fill in the details, milestones, and payment schedule" onClose={() => setShowAddProject(false)} width={660}
      footer={ <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Btn variant="ghost" onClick={() => setShowAddProject(false)}>Cancel</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && <Btn variant="ghost" onClick={() => setStep(s => s-1)}>← Back</Btn>}
            {step < 3
              ? <Btn onClick={() => { if (step===1 && !validate()) return; setStep(s => s+1); }}>Next →</Btn>
              : <Btn onClick={handleSubmit}>Create Project</Btn>
            }
          </div>
        </div>
      }
    >
      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {stepLabels.map((label, i) => (
          <button key={i} onClick={() => setStep(i+1)} style={{ flex: 1, padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: step===i+1 ? 700 : 400, fontFamily: 'var(--font-body)', background: step===i+1 ? 'var(--accent)' : 'var(--bg-elevated)', color: step===i+1 ? '#fff' : 'var(--text-muted)', borderRight: i < 2 ? '1px solid var(--border)' : 'none', borderRadius: i===0?'7px 0 0 7px':i===2?'0 7px 7px 0':'0' }}>
            {i+1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Project Name" required error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Inventory Management System" style={inputStyle(errors.name)} />
            </Field>
            <Field label="Client" required error={errors.clientId}>
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} style={inputStyle(errors.clientId)}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief project overview…" style={{ ...inputStyle(), resize: 'vertical' }} />
          </Field>
          <Field label="Client Commitment (promises made)">
            <textarea value={form.clientCommitment} onChange={e => set('clientCommitment', e.target.value)} rows={2} placeholder="Any delivery promises, demo dates, or features committed to client…" style={{ ...inputStyle(), resize: 'vertical', borderColor: '#92520A50' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Category">
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle()}>
                {Object.values(CATEGORIES).map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Budget (₹)" required error={errors.budget}>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="e.g. 1500000" style={inputStyle(errors.budget)} />
            </Field>
            <Field label="Accent Colour">
              <div style={{ display: 'flex', gap: 6, paddingTop: 5 }}>
                {COLORS.map(c => <div key={c} onClick={() => set('color', c)} style={{ width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer', border: form.color===c ? '3px solid var(--text)' : '2px solid transparent', boxSizing: 'border-box' }} />)}
              </div>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Start Date" required error={errors.startDate}><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle(errors.startDate)} /></Field>
            <Field label="End Date" required error={errors.endDate}><input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inputStyle(errors.endDate)} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="BD Owner">
              <select value={form.bdOwner} onChange={e => set('bdOwner', e.target.value)} style={inputStyle()}>
                <option value="">Select BD…</option>
                {bds.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="PM Owner">
              <select value={form.pmOwner} onChange={e => set('pmOwner', e.target.value)} style={inputStyle()}>
                <option value="">Select PM…</option>
                {pms.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>Define key delivery milestones. You can add more later from the project page.</p>
          {form.milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i+1}</div>
              <input value={m.name} onChange={e => updM(i,'name',e.target.value)} placeholder={`Milestone ${i+1}`} style={{ ...inputStyle(), flex: 1 }} />
              <input type="date" value={m.dueDate} onChange={e => updM(i,'dueDate',e.target.value)} style={{ ...inputStyle(), width: 150 }} />
              {form.milestones.length > 1 && <button onClick={() => setForm(f => ({...f, milestones: f.milestones.filter((_,idx) => idx!==i)}))} style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', padding: 4 }}><Trash2 size={13}/></button>}
            </div>
          ))}
          <button onClick={() => setForm(f => ({...f, milestones: [...f.milestones, {name:'',dueDate:''}]}))} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1.5px dashed var(--border-bright)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:14, cursor:'pointer', width:'fit-content' }}>
            <Plus size={12}/> Add Milestone
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>Set up the payment schedule. Visible to management only.</p>
          {form.payments.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, alignItems: 'center' }}>
              <input type="number" value={p.amount} onChange={e => updP(i,'amount',e.target.value)} placeholder="Amount (₹)" style={inputStyle()} />
              <select value={p.type} onChange={e => updP(i,'type',e.target.value)} style={{ ...inputStyle(), width: 110 }}>
                <option>Advance</option><option>Milestone</option><option>Final</option>
              </select>
              <input type="date" value={p.date} onChange={e => updP(i,'date',e.target.value)} style={{ ...inputStyle(), width: 145 }} />
              {form.payments.length > 1 && <button onClick={() => setForm(f => ({...f, payments: f.payments.filter((_,idx) => idx!==i)}))} style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', padding:4 }}><Trash2 size={13}/></button>}
            </div>
          ))}
          <button onClick={() => setForm(f => ({...f, payments: [...f.payments, {amount:'',date:'',type:'Milestone',notes:''}]}))} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1.5px dashed var(--border-bright)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:14, cursor:'pointer', width:'fit-content' }}>
            <Plus size={12}/> Add Payment
          </button>
        </div>
      )}
    </Modal>
  );
}
