import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Card, Btn, Field, inputStyle, Avatar, PageHeader, Badge } from '../components/UI';
import { Camera, Trash2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import profileService from '../services/profileService';

const MAX_MB = 2;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const errText = (err, fallback) => {
  const e = err.response?.data?.errors;
  return e ? Object.values(e).flat().join(' ') : (err.response?.data?.message || fallback);
};

export default function ProfilePage() {
  const { user, patchUser } = useAuth();
  const { setUsers } = useApp();
  const fileRef = useRef(null);

  const [name, setName]           = useState(user?.name || '');
  const [nameMsg, setNameMsg]     = useState(null);       // {type:'ok'|'err', text}
  const [nameSaving, setNameSaving] = useState(false);

  const [photoMsg, setPhotoMsg]   = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [preview, setPreview]     = useState(null);

  const [pw, setPw]               = useState({ currentPassword:'', password:'', passwordConfirmation:'' });
  const [showPw, setShowPw]       = useState(false);
  const [pwErrors, setPwErrors]   = useState({});
  const [pwMsg, setPwMsg]         = useState(null);
  const [pwSaving, setPwSaving]   = useState(false);

  /* push the updated user into auth state + the shared users list (so avatars update everywhere instantly) */
  const sync = (u) => {
    patchUser(u);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...u } : x));
  };

  /* ── name ───────────────────────────────────────────── */
  const saveName = async () => {
    if (!name.trim()) { setNameMsg({ type:'err', text:'Name is required.' }); return; }
    setNameSaving(true); setNameMsg(null);
    try { sync(await profileService.updateName(name.trim())); setNameMsg({ type:'ok', text:'Name updated.' }); }
    catch (err) { setNameMsg({ type:'err', text: errText(err, 'Could not update name.') }); }
    finally { setNameSaving(false); }
  };

  /* ── photo ──────────────────────────────────────────── */
  const pickFile = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) { setPhotoMsg({ type:'err', text:'Please choose a JPG, PNG or WebP image.' }); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setPhotoMsg({ type:'err', text:`Photo must be ${MAX_MB} MB or smaller.` }); return; }

    setPreview(URL.createObjectURL(file));
    setPhotoBusy(true); setPhotoMsg(null); setProgress(0);
    try { sync(await profileService.uploadPhoto(file, setProgress)); setPhotoMsg({ type:'ok', text:'Profile photo updated.' }); }
    catch (err) { setPhotoMsg({ type:'err', text: errText(err, 'Upload failed.') }); }
    finally { setPhotoBusy(false); setPreview(null); }
  };
  const removePhoto = async () => {
    setPhotoBusy(true); setPhotoMsg(null);
    try { sync(await profileService.deletePhoto()); setPhotoMsg({ type:'ok', text:'Photo removed.' }); }
    catch (err) { setPhotoMsg({ type:'err', text: errText(err, 'Could not remove photo.') }); }
    finally { setPhotoBusy(false); }
  };

  /* ── password ───────────────────────────────────────── */
  const savePassword = async () => {
    const e = {};
    if (!pw.currentPassword) e.currentPassword = 'Required';
    if (pw.password.length < 8) e.password = 'Minimum 8 characters';
    else if (pw.password === pw.currentPassword) e.password = 'Must differ from the current password';
    if (pw.password !== pw.passwordConfirmation) e.passwordConfirmation = 'Passwords do not match';
    setPwErrors(e); setPwMsg(null);
    if (Object.keys(e).length) return;

    setPwSaving(true);
    try {
      await profileService.changePassword(pw);
      setPw({ currentPassword:'', password:'', passwordConfirmation:'' });
      setPwMsg({ type:'ok', text:'Password changed. Other devices have been signed out.' });
    } catch (err) {
      const fe = err.response?.data?.errors || {};
      setPwErrors({
        currentPassword: fe.current_password?.[0],
        password: fe.password?.[0],
      });
      if (!fe.current_password && !fe.password) setPwMsg({ type:'err', text: errText(err, 'Could not change password.') });
    } finally { setPwSaving(false); }
  };

  const Msg = ({ m }) => m ? (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, marginTop:10, color: m.type === 'ok' ? 'var(--success)' : 'var(--danger)' }}>
      {m.type === 'ok' && <CheckCircle2 size={14}/>}{m.text}
    </div>
  ) : null;

  const shownUser = preview ? { ...user, avatarUrl: preview, avatar_url: preview } : user;
  const hasPhoto = !!(user?.avatarUrl || user?.avatar_url);

  return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      <PageHeader sub="Update your photo, name and password"/>

      {/* Photo + identity */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:22, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <Avatar user={shownUser} size={96} fontSize={32}/>
            {photoBusy && (
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(27,46,107,0.55)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700 }}>
                {progress ? `${progress}%` : '…'}
              </div>
            )}
          </div>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ fontSize:18, fontWeight:700, color:'#1B2E6B' }}>{user?.name}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', margin:'2px 0 8px' }}>{user?.email}</div>
            <Badge label={(user?.role || '').replace(/_/g, ' ')} color="#2E6DB4"/>
            <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
              <Btn icon={<Camera size={13}/>} onClick={pickFile} disabled={photoBusy}>{hasPhoto ? 'Change photo' : 'Upload photo'}</Btn>
              {hasPhoto && <Btn variant="ghost" icon={<Trash2 size={13}/>} onClick={removePhoto} disabled={photoBusy}>Remove</Btn>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display:'none' }}/>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>JPG, PNG or WebP · up to {MAX_MB} MB. Shown everywhere instead of your initials.</div>
            <Msg m={photoMsg}/>
          </div>
        </div>
      </Card>

      {/* Name */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:15, color:'#1B2E6B', marginBottom:12 }}>Profile</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Full Name" required>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={120} style={inputStyle()}/>
          </Field>
          <Field label="Email (contact an admin to change)">
            <input value={user?.email || ''} disabled style={{ ...inputStyle(), opacity:0.7 }}/>
          </Field>
        </div>
        <div style={{ marginTop:12 }}><Btn onClick={saveName} disabled={nameSaving || name.trim() === user?.name}>{nameSaving ? 'Saving…' : 'Save name'}</Btn></div>
        <Msg m={nameMsg}/>
      </Card>

      {/* Password */}
      <Card>
        <div style={{ fontWeight:700, fontSize:15, color:'#1B2E6B', marginBottom:12 }}>Change password</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:420 }}>
          <Field label="Current password" required error={pwErrors.currentPassword}>
            <input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword:e.target.value }))} style={inputStyle(pwErrors.currentPassword)}/>
          </Field>
          <Field label="New password" required error={pwErrors.password}>
            <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={pw.password} onChange={e => setPw(p => ({ ...p, password:e.target.value }))} placeholder="Minimum 8 characters" style={inputStyle(pwErrors.password)}/>
          </Field>
          <Field label="Confirm new password" required error={pwErrors.passwordConfirmation}>
            <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={pw.passwordConfirmation} onChange={e => setPw(p => ({ ...p, passwordConfirmation:e.target.value }))} style={inputStyle(pwErrors.passwordConfirmation)}/>
          </Field>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-dim)', cursor:'pointer' }} onClick={() => setShowPw(s => !s)}>
            {showPw ? <EyeOff size={14}/> : <Eye size={14}/>} {showPw ? 'Hide' : 'Show'} passwords
          </label>
        </div>
        <div style={{ marginTop:12 }}><Btn onClick={savePassword} disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Update password'}</Btn></div>
        <Msg m={pwMsg}/>
      </Card>
    </div>
  );
}
