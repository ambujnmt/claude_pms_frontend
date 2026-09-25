import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Btn, Modal, Field, inputStyle, ConfirmModal, PageHeader, ActionMenu, Badge, EmptyState } from '../components/UI';
import { Plus, FolderKanban } from 'lucide-react';
import categoryService from '../services/categoryService';

const COLOR_OPTS = ['#1B2E6B','#2E6DB4','#4A90D9','#4C3A9E','#1A6B3C','#8B5E0A','#9B1C1C','#A85010'];
const ICONS      = ['🌐','📱','🤖','💻','🎨','🔧','📊','🎯','🚀','⚙️','📦','🔍'];
const EMPTY       = { name:'', color:'#2E6DB4', icon:'🌐', isActive:true };

export default function CategoryPage() {
  const { categories, setCategories, projects, isManagement, dataLoading } = useApp();

  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (c) => { setForm({ name:c.name, color:c.color, icon:c.icon||'🌐', isActive:c.isActive }); setEditing(c.id); setErrors({}); setShowModal(true); };

  const getProjectCount = (name) => projects.filter(p => p.category === name).length;

  const handleSave = async () => {
    if (!form.name.trim()) { setErrors({ name:'Required' }); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await categoryService.update(editing, form);
        setCategories(prev => prev.map(c => c.id === editing ? updated : c));
      } else {
        const created = await categoryService.create(form);
        setCategories(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : err.response?.data?.message || 'Failed to save.';
      setErrors({ api: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryService.delete(confirmDel);
      setCategories(prev => prev.filter(c => c.id !== confirmDel));
      setConfirmDel(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.');
      setConfirmDel(null);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Categories"
        sub="Project categories used across Nexus PM"
        action={isManagement && <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Category</Btn>}
      />

      {dataLoading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:14 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:130, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.5 }}/>)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:14 }}>
          {categories.map(c => {
            const count = getProjectCount(c.name);
            return (
              <Card key={c.id} style={{ padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${c.color}18`, border:`1.5px solid ${c.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{c.icon || '🌐'}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{c.name}</div>
                      <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{count} project{count!==1?'s':''}</div>
                    </div>
                  </div>
                  {isManagement && <ActionMenu onEdit={() => openEdit(c)} onDelete={() => setConfirmDel(c.id)}/>}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                  <Badge label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'var(--success)' : 'var(--text-muted)'}/>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Colour: <strong style={{ color:c.color }}>{c.color}</strong></span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!dataLoading && categories.length === 0 && <EmptyState icon="📁" message="No categories yet."/>}

      {showModal && (
        <Modal title={editing?'Edit Category':'Add Category'} onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Saving…':editing?'Save':'Create'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{errors.api}</div>}
            <Field label="Category Name" required error={errors.name}>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. E-Commerce" style={inputStyle(errors.name)} autoFocus/>
            </Field>
            <Field label="Icon">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {ICONS.map(ic => <div key={ic} onClick={() => setForm(f=>({...f,icon:ic}))} style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer', background:form.icon===ic?'var(--accent-dim)':'var(--bg-elevated)', border:`2px solid ${form.icon===ic?'#2E6DB4':'transparent'}` }}>{ic}</div>)}
              </div>
            </Field>
            <Field label="Colour">
              <div style={{ display:'flex', gap:8 }}>
                {COLOR_OPTS.map(c => <div key={c} onClick={() => setForm(f=>({...f,color:c}))} style={{ width:26, height:26, borderRadius:7, background:c, cursor:'pointer', border:form.color===c?'3px solid var(--text)':'2px solid transparent', boxSizing:'border-box' }}/>)}
              </div>
            </Field>
            <Field label="Status">
              <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(f=>({...f,isActive:e.target.value==='active'}))} style={inputStyle()}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal message="Delete this category? Projects using it will keep their current category value, but it won't be selectable for new projects." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)}/>
      )}
    </div>
  );
}
