import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Btn, Field, inputStyle, PageHeader } from '../components/UI';
import { CalendarRange, CheckCircle2 } from 'lucide-react';
import settingsService, { settingsError } from '../services/settingsService';
import { autoCycle, resolveCycle, fmtCycleDate, toISO, toLocalDate } from '../utils/billingCycle';

const NAVY = '#1B2E6B';
const today0 = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };

function Notice({ kind, children }) {
  const ok = kind === 'ok';
  return (
    <div style={{ padding:'9px 12px', borderRadius:7, fontSize:13, background: ok ? '#EDF7F2' : 'var(--danger-dim)', color: ok ? '#1A6B3C' : 'var(--danger)', display:'flex', alignItems:'center', gap:6 }}>
      {ok && <CheckCircle2 size={14}/>}{children}
    </div>
  );
}

/* ═════════════ Settings > Billing Cycle (Super Admin) ═════════════ */
export function BillingCycleSettings() {
  const { billingCycle, setBillingCycle } = useApp();
  const today = useMemo(today0, []);
  const effective = useMemo(() => resolveCycle(billingCycle, today), [billingCycle, today]);

  const [start, setStart] = useState('');
  const [end, setEnd]     = useState('');
  const [err, setErr]     = useState('');
  const [okMsg, setOk]    = useState('');
  const [busy, setBusy]   = useState(false);

  useEffect(() => {                       // form starts with what the dashboard uses right now
    setStart(toISO(effective.start)); setEnd(toISO(effective.end));
  }, [effective.start.getTime(), effective.end.getTime()]);

  const fill = (c) => { setStart(toISO(c.start)); setEnd(toISO(c.end)); setErr(''); setOk(''); };
  const nextCycle = () => { const a = autoCycle(today); return { start: a.end, end: new Date(a.end.getFullYear(), a.end.getMonth() + 1, 15) }; };

  const save = async () => {
    setErr(''); setOk('');
    if (!start) return setErr('Please choose the cycle start date.');
    if (!end)   return setErr('Please choose the cycle end date.');
    if (toLocalDate(end) <= toLocalDate(start)) return setErr('The end date must be after the start date.');
    setBusy(true);
    try {
      const saved = await settingsService.saveBillingCycle({ start, end });
      setBillingCycle(saved);
      setOk('Billing cycle updated. The dashboard now uses this cycle.');
    } catch (e) { setErr(settingsError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth:720 }}>
      <PageHeader sub="Set the current billing cycle. The dashboard payment status updates automatically." />

      <Card style={{ padding:20, marginBottom:16, borderTop:`3px solid ${NAVY}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <CalendarRange size={18} color={NAVY}/>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Current billing cycle on the dashboard</div>
        </div>
        <div style={{ fontSize:24, fontWeight:700, color:NAVY }}>{fmtCycleDate(effective.start)} - {fmtCycleDate(effective.end)}</div>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
          {effective.source === 'custom'
            ? 'Saved by the Super Admin.'
            : billingCycle ? 'The saved cycle has ended, so the dashboard is using the automatic 15th to 15th cycle. Save a new one below to override it.'
                           : 'Nothing saved yet - using the automatic 15th to 15th cycle.'}
        </div>
      </Card>

      <Card style={{ padding:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:12 }}>Update billing cycle</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {err  && <Notice kind="err">{err}</Notice>}
          {okMsg && <Notice kind="ok">{okMsg}</Notice>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Cycle starts on" required><input type="date" value={start} onChange={e => { setStart(e.target.value); setOk(''); }} style={inputStyle()}/></Field>
            <Field label="Cycle ends on (next cycle starts)" required><input type="date" value={end} onChange={e => { setEnd(e.target.value); setOk(''); }} style={inputStyle()}/></Field>
          </div>
          <div style={{ fontSize:12.5, color:'var(--text-muted)' }}>
            A payment dated on the start date is inside this cycle; a payment dated on the end date belongs to the next cycle.
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save Billing Cycle'}</Btn>
            <Btn variant="ghost" onClick={() => fill(autoCycle(today))}>Use standard 15th–15th (this cycle)</Btn>
            <Btn variant="ghost" onClick={() => fill(nextCycle())}>Next cycle</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
