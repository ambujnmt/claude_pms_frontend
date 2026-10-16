import { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Avatar } from './UI';

/* Props:
 *  users     — full list of user objects { id, name, avatar, role }
 *  value     — array of selected user ids
 *  onChange  — (newArray) => void
 *  roleFilter— optional: only show users whose role is in this array
 */
export default function UserMultiSelect({ users, value = [], onChange, roleFilter, placeholder = 'Search team members…' }) {
  const [search, setSearch] = useState('');

  const pool = roleFilter ? users.filter(u => roleFilter.includes(u.role)) : users;
  const filtered = pool.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  const selectedUsers = users.filter(u => value.includes(u.id));

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  return (
    <div>
      {selectedUsers.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {selectedUsers.map(u => (
            <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 4px', borderRadius: 14, background: 'var(--accent-dim)', border: '1px solid #2E6DB430', fontSize: 12, fontWeight: 600, color: '#2E6DB4' }}>
              <Avatar user={u} size={18}/>
              {u.name}
              <span onClick={() => toggle(u.id)} style={{ cursor: 'pointer', marginLeft: 2, opacity: 0.6, fontWeight: 800 }}>×</span>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', marginBottom: 6, background: 'var(--bg-surface)' }}>
        <Search size={12} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder}
          style={{ border: 'none', outline: 'none', background: 'none', fontSize: 13, flex: 1, fontFamily: 'var(--font-body)' }} />
      </div>

      <div style={{ maxHeight: 170, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 7 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No team members found.</div>
        )}
        {filtered.map(u => {
          const checked = value.includes(u.id);
          return (
            <div key={u.id} onClick={() => toggle(u.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: checked ? 'var(--accent-dim)' : 'transparent' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? '#2E6DB4' : 'var(--border)'}`, background: checked ? '#2E6DB4' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {checked && <Check size={11} color="#fff" />}
              </div>
              <Avatar user={u} size={22} bg="var(--bg-elevated)" color="var(--text-muted)"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{(u.role || '').replace(/_/g, ' ')}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
