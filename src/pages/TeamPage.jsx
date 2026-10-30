import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Card, Btn, Modal, Field, inputStyle, ConfirmModal,
  PageHeader, ActionMenu, Badge, EmptyState, Table, TR, TD,
  Avatar,
} from '../components/UI';
import { Plus, Search, Users } from 'lucide-react';
import teamService from '../services/teamService';
import userService from '../services/userService';
import api from '../services/api';

export const ROLES = [
  { value: 'super_admin',     label: 'Super Admin',          color: '#9B1C1C' },
  { value: 'management',      label: 'Management',           color: '#1B2E6B' },
  { value: 'pm',              label: 'Project Manager',      color: '#2E6DB4' },
  { value: 'bd',              label: 'Business Development', color: '#4C3A9E' },
  { value: 'team_lead',       label: 'Team Lead',            color: '#1A6B3C' },
  { value: 'developer',       label: 'Developer',            color: '#4A90D9' },
  { value: 'designer',        label: 'Designer',             color: '#A85010' },
  { value: 'marketing',       label: 'Marketing',            color: '#8B5E0A' },
  { value: 'qa',              label: 'QA Engineer',          color: '#0E7C7B' },
  { value: 'devops',          label: 'DevOps',               color: '#5B21B6' },
  { value: 'sales',           label: 'Sales',                color: '#9B1C1C' },
  { value: 'account_manager', label: 'Account Manager',      color: '#2E6DB4' },
  { value: 'hr',              label: 'HR',                   color: '#BE185D' },
  { value: 'finance',         label: 'Finance',               color: '#166534' },
];

export const roleLabel = (value) => ROLES.find(r => r.value === value)?.label || value;
export const roleColor = (value) => ROLES.find(r => r.value === value)?.color || 'var(--text-muted)';

const EMPTY = { name:'', email:'', password:'', role:'developer', avatar:'', isActive:true, managerId:'' };

/* roles that can own a team - the project Resources picker of these roles lists only their reports */
const TEAM_OWNER_ROLES = ['pm', 'team_lead', 'account_manager'];
/* roles that never report to a manager */
const NO_MANAGER_ROLES = ['super_admin', 'management', 'pm', 'team_lead', 'account_manager', 'bd'];

/* The /users list does not always include each person's photo link. Fall back to the public photo URL
   (GET /api/avatars/{id}); <Avatar> shows the initials automatically when that user has no photo. */
const withPhoto = (u) => (u.avatar_url || u.avatarUrl) ? u : { ...u, avatar_url: `${api.defaults.baseURL}/avatars/${u.id}` };

export default function TeamPage() {
  const { users, setUsers, isManagement, user: currentUser, dataLoading } = useApp();

  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [form, setForm]             = useState(EMPTY);
  const [editing, setEditing]       = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* reporting lines (who reports to which manager) - editable by Super Admin / Management */
  const [managerOf, setManagerOf] = useState({});          // { userId: managerId }
  useEffect(() => {
    if (!isManagement) return;
    teamService.structure().then(rows => setManagerOf(Object.fromEntries(rows.map(r => [r.id, r.managerId])))).catch(() => {});
  }, [isManagement, users.length]);
  const managers = users.filter(u => TEAM_OWNER_ROLES.includes(u.role) && u.is_active !== false);
  const managerName = (uid) => users.find(u => u.id === managerOf[uid])?.name;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const ms = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return ms && (filterRole === 'all' || u.role === filterRole);
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ name:u.name, email:u.email, password:'', role:u.role, avatar:u.avatar||'', isActive:u.is_active, managerId: managerOf[u.id] || '' });
    setEditing(u.id); setErrors({}); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!editing && !form.password) e.password = 'Required for new team members';
    if (form.password && form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* persist "Reports to" when it changed (non-manager roles only) */
  const saveManager = async (userId) => {
    if (!isManagement) return;
    const want = NO_MANAGER_ROLES.includes(form.role) ? '' : (form.managerId || '');
    if (String(want) === String(managerOf[userId] || '')) return;
    await teamService.setManager(userId, want || null);
    setManagerOf(prev => ({ ...prev, [userId]: want ? parseInt(want) : null }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await userService.update(editing, form);
        setUsers(prev => prev.map(u => u.id === editing ? updated : u));
        await saveManager(editing);
      } else {
        const created = await userService.create(form);
        setUsers(prev => [...prev, created]);
        await saveManager(created.id);
      }
      setShowModal(false);
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : err.response?.data?.message || 'Failed to save.';
      setErrors({ api: msgs });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await userService.delete(confirmDel);
      setUsers(prev => prev.filter(u => u.id !== confirmDel));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove team member.');
    }
    setConfirmDel(null);
  };

  return (
    <div className="fade-in">
      <PageHeader
        sub="Manage every team member and their role — used across BD Owner and Resources selections"
        action={isManagement && <Btn icon={<Plus size={14}/>} onClick={openAdd}>Add Team Member</Btn>}
      />

      {/* Filters */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ flex:1, minWidth:220, maxWidth:320, display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0 12px', height:36 }}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'var(--font-body)' }}/>
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle(), width:'auto', height:36, padding:'0 12px', fontSize:13 }}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{filtered.length} of {users.length}</span>
      </div>

      <Card style={{ padding:0, overflow:'hidden' }}>
        {dataLoading ? (
          <div style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading team…</div>
        ) : (
          <Table headers={['Name','Email','Role', ...(isManagement?['Reports To']:[]), 'Status', isManagement?'Actions':'']}>
            {filtered.map(u => (
              <TR key={u.id}>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <Avatar user={withPhoto(u)} size={30} bg={roleColor(u.role)}/>
                    <span style={{ fontWeight:600 }}>{u.name}{u.id === currentUser?.id && <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:400 }}> (you)</span>}</span>
                  </div>
                </TD>
                <TD><span style={{ color:'var(--text-muted)' }}>{u.email}</span></TD>
                <TD><Badge label={roleLabel(u.role)} color={roleColor(u.role)}/></TD>
                {isManagement && <TD><span style={{ color:'var(--text-muted)' }}>{managerName(u.id) || '—'}</span></TD>}
                <TD><Badge label={u.is_active ? 'Active' : 'Inactive'} color={u.is_active ? 'var(--success)' : 'var(--text-muted)'}/></TD>
                {isManagement && (
                  <TD>
                    <ActionMenu onEdit={() => openEdit(u)} onDelete={() => setConfirmDel(u.id)}/>
                  </TD>
                )}
              </TR>
            ))}
          </Table>
        )}
        {!dataLoading && filtered.length === 0 && <EmptyState icon="👥" message="No team members found."/>}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Team Member' : 'Add Team Member'} onClose={() => setShowModal(false)} width={520}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Saving…':editing?'Save Changes':'Add Member'}</Btn></>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {errors.api && <div style={{ padding:'8px 12px', borderRadius:7, background:'var(--danger-dim)', color:'var(--danger)', fontSize:13 }}>{errors.api}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Full Name" required error={errors.name}>
                <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle(errors.name)} autoFocus/>
              </Field>
              <Field label="Email" required error={errors.email}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle(errors.email)}/>
              </Field>
            </div>

            <Field label={editing ? 'New Password (leave blank to keep current)' : 'Password'} required={!editing} error={errors.password}>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={editing ? '••••••••' : 'Minimum 6 characters'} style={inputStyle(errors.password)}/>
            </Field>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Role">
                <select value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle()}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')} style={inputStyle()}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            {isManagement && !NO_MANAGER_ROLES.includes(form.role) && (
              <Field label="Reports to (manager)">
                <select value={form.managerId || ''} onChange={e => set('managerId', e.target.value)} style={inputStyle()}>
                  <option value="">— Not assigned —</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name} · {roleLabel(m.role)}</option>)}
                </select>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:5 }}>This manager will see this person in the project “Resources” list.</div>
              </Field>
            )}

            <Field label="Avatar Initials (optional — your uploaded photo takes priority)">
              <input value={form.avatar} onChange={e => set('avatar', e.target.value.toUpperCase().slice(0,3))} placeholder="Auto-generated if left blank" style={inputStyle()}/>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal message="Remove this team member? They will be unassigned from any projects but existing records stay intact." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)}/>
      )}
    </div>
  );
}
