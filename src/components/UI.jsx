// ─── Card ────────────────────────────────────────────────────────
export function Card({ children, style = {}, hover, onClick }) { return (
    <div onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', transition: 'all 0.16s', cursor: onClick ? 'pointer' : 'default', ...style, }}
      onMouseEnter={e => { if (hover||onClick) { e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
      onMouseLeave={e => { if (hover||onClick) { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='none'; }}}
    >{children}</div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children, footer, width = 560 }) { return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(17,24,39,0.45)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, }} onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="scale-in" style={{ background:'var(--bg-card)', borderRadius:14, width:'100%', maxWidth:width, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-lg)', border:'1px solid var(--border)', }}>
        <div style={{ padding:'0 22px', height:54, background:'#1B2E6B', borderRadius:'14px 14px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.1px' }}>{title}</h2>
            {subtitle && <p style={{ fontSize:14, color:'rgba(168,206,236,0.75)', marginTop:2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.12)', border:'none', width:26, height:26, borderRadius:6, color:'#fff', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'18px 22px' }}>{children}</div>
        {footer && <div style={{ padding:'13px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── ConfirmModal ────────────────────────────────────────────────
export function ConfirmModal({ message, onConfirm, onCancel, danger = true }) { return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(17,24,39,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="scale-in" style={{ background:'var(--bg-card)', borderRadius:13, overflow:'hidden', maxWidth:360, width:'100%', boxShadow:'var(--shadow-lg)', margin:20 }}>
        <div style={{ background:'#1B2E6B', padding:'14px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>Confirm Action</div>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, marginBottom:20 }}>{message}</div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
            <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────
export function Btn({ children, onClick, variant='primary', size='md', icon, style:sx={}, disabled=false, type='button' }) { const base = { display:'inline-flex', alignItems:'center', gap:6, border:'none', cursor:disabled?'not-allowed':'pointer', fontFamily:'var(--font-body)', fontWeight:600, borderRadius:7, transition:'all 0.14s', opacity:disabled?0.5:1, letterSpacing:'-0.1px' };
  const sizes = { sm: { padding:'5px 12px', fontSize:14 }, md: { padding:'7px 16px', fontSize:14 }, lg: { padding:'10px 22px', fontSize:14 }, };
  const variants = { primary: { background:'#2E6DB4', color:'#fff', boxShadow:'0 1px 4px rgba(46,109,180,0.25)' }, ghost:   { background:'var(--bg-elevated)', color:'var(--text-muted)', border:'1px solid var(--border)' }, danger:  { background:'var(--danger)', color:'#fff' }, success: { background:'var(--success)', color:'#fff' }, outline: { background:'transparent', color:'#2E6DB4', border:'1.5px solid #2E6DB4' }, navy:    { background:'#1B2E6B', color:'#fff' }, };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...sx }}
      onMouseEnter={e => { if (!disabled && variant==='primary') e.currentTarget.style.background='#235D9E'; }}
      onMouseLeave={e => { if (!disabled && variant==='primary') e.currentTarget.style.background='#2E6DB4'; }}
    >{icon}{children}</button>
  );
}

// ─── Form Fields ─────────────────────────────────────────────────
// Forms: 14px per spec
export function Field({ label, error, required, children }) { return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:14, fontWeight:600, color:'var(--text-muted)' }}>
        {label}{required && <span style={{ color:'var(--danger)', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize:14, color:'var(--danger)' }}>⚠ {error}</span>}
    </div>
  );
}

export const inputStyle = (err) => ({ width:'100%', padding:'8px 11px', fontSize:14, /* forms: 14px */
  fontFamily:'var(--font-body)', border:`1px solid ${err ? 'var(--danger)' : 'var(--border)'}`, borderRadius:7, background:'var(--bg-surface)', color:'var(--text)', outline:'none', transition:'border-color 0.15s',
});

// ─── Badges ──────────────────────────────────────────────────────
export function Badge({ label, color='#2E6DB4', bg }) { return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:5, fontSize:14, fontWeight:600, background: bg || `${color}15`, color, border:`1px solid ${color}28`, whiteSpace:'nowrap', letterSpacing:'0.1px', }}>{label}</span>
  );
}

export function StatusBadge({ status }) { const m = { active:        { color:'var(--success)', label:'Active' }, completed:     { color:'#2E6DB4', label:'Completed' }, 'on-hold':     { color:'var(--warning)', label:'On Hold' }, overdue:       { color:'var(--danger)', label:'Overdue' }, 'in-progress': { color:'#4A90D9', label:'In Progress' }, upcoming:      { color:'var(--text-muted)', label:'Upcoming' }, pending:       { color:'var(--warning)', label:'Pending' }, received:      { color:'var(--success)', label:'Received' }, 'due-soon':    { color:'var(--orange)', label:'Due Soon' }, paused:        { color:'var(--text-muted)', label:'Paused' }, };
  const s = m[status] || { color:'var(--text-muted)', label:status };
  return <Badge label={s.label} color={s.color} />;
}

// ─── Progress ────────────────────────────────────────────────────
export function ProgressBar({ value, color='#2E6DB4', height=6, showLabel, bg }) { return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height, background: bg||'var(--bg-elevated)', borderRadius:height, overflow:'hidden' }}>
        <div style={{ width:`${Math.min(value,100)}%`, height:'100%', background:color, borderRadius:height, transition:'width 0.5s ease' }} />
      </div>
      {showLabel && <span style={{ fontSize:14, fontWeight:600, color, minWidth:32, textAlign:'right', }}>{value}%</span>}
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────
// Tables: 13px per spec
export function Table({ headers, children }) { return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'#1B2E6B' }}>
            {headers.map(h => (
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:14, fontWeight:700, color:'rgba(168,206,236,0.9)', borderBottom:'none', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.5px', }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick, highlighted }) { return (
    <tr onClick={onClick}
      style={{ borderBottom:'1px solid var(--border)', background: highlighted?'#EEF4FB':'transparent', transition:'background 0.12s', cursor: onClick?'pointer':'default' }}
      onMouseEnter={e => { if (!highlighted) e.currentTarget.style.background='var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!highlighted) e.currentTarget.style.background='transparent'; }}
    >{children}</tr>
  );
}

export function TD({ children, style }) { return <td style={{ padding:'10px 14px', fontSize:14, verticalAlign:'middle', ...style }}>{children}</td>;
}

// ─── Page Header ─────────────────────────────────────────────────
// Page Titles: 28px per spec
export function PageHeader({ title, sub, action }) { return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, paddingBottom:14, borderBottom:'2px solid #2E6DB4' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'#1B2E6B', letterSpacing:'-0.5px', lineHeight:1 }}>{title}</h1>
        {sub && <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:6 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Section Title ───────────────────────────────────────────────
// Card Titles: 16px per spec
export function SectionTitle({ children, sub }) { return (
    <div style={{ marginBottom:14 }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'#1B2E6B', letterSpacing:'-0.2px' }}>{children}</h2>
      {sub && <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{sub}</p>}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────
export function EmptyState({ icon='📂', message }) { return <div style={{ padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
    <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>{message}
  </div>;
}

// ─── Action Menu ─────────────────────────────────────────────────
export function ActionMenu({ onEdit, onDelete }) { return (
    <div style={{ display:'flex', gap:4 }}>
      <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid var(--border)', background:'var(--bg-elevated)', fontSize:14, cursor:'pointer', color:'#2E6DB4', fontWeight:600 }}>Edit</button>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #9B1C1C28', background:'var(--danger-dim)', fontSize:14, cursor:'pointer', color:'var(--danger)', fontWeight:600 }}>Delete</button>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────
export function formatCurrency(amount) { if (amount >= 100000) return `₹${(amount/100000).toFixed(1)}L`;
  if (amount >= 1000)   return `₹${(amount/1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export function formatDate(d) { if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

export function CategoryColor(cat) { return { Website:'#2E6DB4', 'Mobile App':'#4C3A9E', 'AI/ML':'#A85010' }[cat] || 'var(--text-muted)';
}
