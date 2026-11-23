import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, ProgressBar, Badge, formatDate, PageHeader, EmptyState, Avatar } from '../components/UI';
import { roleLabel, roleColor } from './TeamPage';
import { projectTypeOf } from '../utils/projectTypes';
import {
  Users, AlertOctagon, Calendar, Briefcase, Wrench, Info, ChevronDown, ChevronRight,
  Search, UserCheck, Flame, RefreshCw,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════
   HOW WORKLOAD IS CALCULATED (shown to the user in the "How it works" box)

   1. Only LIVE work counts:  projects with status "active"  +  Digital contracts with status "active".
   2. A person's workload = number of live items they are assigned to:
        • Resources tab  -> items where the person is in the project's / contract's Resources list
        • Project Managers -> projects where the person is the PM owner
        • Business Development -> projects + contracts where the person is the BD owner
   3. Load level (resources):  0 = Available · 1–2 = Balanced · 3–4 = Busy · 5+ = Overloaded
   4. Money is shown in US $ only. Budgets / contract values are converted from the project's own
      currency with TODAY's live exchange rate (same rate source the payments use).
   ════════════════════════════════════════════════════════════════════ */

const MANAGER_ROLES = ['super_admin', 'management', 'pm', 'team_lead', 'account_manager', 'bd'];

const LEVELS = [
  { key: 'available',  label: 'Available',  min: 0, max: 0,        color: '#6B7A99', bg: '#F1F3F8', hint: 'No live work' },
  { key: 'balanced',   label: 'Balanced',   min: 1, max: 2,        color: '#1A6B3C', bg: '#EDF7F2', hint: '1–2 items' },
  { key: 'busy',       label: 'Busy',       min: 3, max: 4,        color: '#A85010', bg: '#FDF3EA', hint: '3–4 items' },
  { key: 'overloaded', label: 'Overloaded', min: 5, max: Infinity, color: '#9B1C1C', bg: '#FEF2F2', hint: '5+ items' },
];
const levelOf = (n) => LEVELS.find(l => n >= l.min && n <= l.max);
const BAR_SCALE = 5;                          // 5 items = full bar (the "Overloaded" line)

const TYPE_META = {
  web:     { label: 'Web',     color: '#1B2E6B' },
  mobile:  { label: 'Mobile',  color: '#2E6DB4' },
  digital: { label: 'Digital', color: '#1A6B3C' },
};

/* Whole-day difference between a 'YYYY-MM-DD' date and today (local time, no timezone drift) */
function daysUntil(ymd) {
  if (!ymd) return null;
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

const sameId = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

export default function ResourcesPage() {
  const {
    projects, clientServices, users, dataLoading,
    fmtUsd, usdSum, usdRates, loadUsdRates, currencyOf,
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab]           = useState('resources');   // resources | pm | bd
  const [typeFilter, setType]   = useState('all');         // all | web | mobile | digital
  const [levelFilter, setLevel] = useState('all');
  const [roleFilter, setRole]   = useState('all');
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState({});            // expanded person rows
  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ── 1. All LIVE work items (active projects + active contracts) in one shape ── */
  const allItems = useMemo(() => {
    const proj = projects.filter(p => p.status === 'active').map(p => ({
      key: `p${p.id}`, kind: 'project', raw: p,
      type: projectTypeOf(p.category),
      name: p.name, client: p.client || '',
      sub: p.category,
      due: p.endDate, dueLabel: 'Due',
      completion: p.completion || 0,
      resourceIds: (p.resourceIds || (p.resources || []).map(r => r.id) || []).map(String),
      pmOwner: p.pmOwner, bdOwner: p.bdOwner,
      link: `/projects/${p.id}`,
    }));
    const contracts = clientServices.filter(c => c.status === 'active').map(c => ({
      key: `c${c.id}`, kind: 'contract', raw: c,
      type: 'digital',
      name: c.name, client: c.client?.name || '',
      sub: c.contractType || 'Contract',
      due: c.renewalDate, dueLabel: 'Renews',
      completion: null,
      resourceIds: (c.resourceIds || (c.resources || []).map(r => r.id) || []).map(String),
      pmOwner: null, bdOwner: c.bdOwner,
      link: `/maintenance/${c.id}`,
    }));
    return [...proj, ...contracts];
  }, [projects, clientServices]);

  const items = useMemo(
    () => typeFilter === 'all' ? allItems : allItems.filter(i => i.type === typeFilter),
    [allItems, typeFilter]
  );

  const withDates = (list) => list.map(i => ({ ...i, daysLeft: i.kind === 'project' ? daysUntil(i.due) : null }));
  const overdueOf = (list) => list.filter(i => i.kind === 'project' && i.daysLeft !== null && i.daysLeft < 0);
  const dueSoonOf = (list) => list.filter(i => i.kind === 'project' && i.daysLeft !== null && i.daysLeft >= 0 && i.daysLeft <= 14);

  const activeUsers = useMemo(() => users.filter(u => u.is_active !== false && u.isActive !== false), [users]);
  const userById = (id) => users.find(u => sameId(u.id, id));

  /* ── 2a. Resources (developers, designers, QA, ...) ── */
  const resourceRows = useMemo(() => {
    // Employees only: Super Admin, Management, PM, Team Lead, Account Manager and BD are never listed here
    // (even if added as a resource) - PMs and BD have their own tabs.
    const people = activeUsers.filter(u => !MANAGER_ROLES.includes(u.role));
    return people.map(u => {
      const list = withDates(items.filter(i => i.resourceIds.includes(String(u.id))));
      return {
        user: u, list,
        count: list.length,
        projects: list.filter(i => i.kind === 'project').length,
        contracts: list.filter(i => i.kind === 'contract').length,
        overdue: overdueOf(list).length,
        dueSoon: dueSoonOf(list).length,
        level: levelOf(list.length),
      };
    }).sort((a, b) => b.count - a.count || b.overdue - a.overdue || a.user.name.localeCompare(b.user.name));
  }, [items, activeUsers]);

  /* ── 2b. Project Managers ── */
  const pmRows = useMemo(() => {
    const projItems = items.filter(i => i.kind === 'project');
    const map = new Map();
    projItems.forEach(i => {
      const k = i.pmOwner ? String(i.pmOwner) : 'none';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(i);
    });
    return [...map.entries()].map(([k, list]) => {
      const l = withDates(list);
      const budget = usdSum(l.map(i => i.raw), p => p.budget);
      return {
        key: k,
        user: k === 'none' ? { name: 'No PM assigned' } : (userById(k) || { name: l[0].raw.pmOwnerName || 'Unknown user' }),
        list: l, count: l.length,
        avgCompletion: Math.round(l.reduce((s, i) => s + (i.completion || 0), 0) / l.length),
        overdue: overdueOf(l).length, dueSoon: dueSoonOf(l).length,
        budget,
      };
    }).sort((a, b) => (a.key === 'none') - (b.key === 'none') || b.count - a.count);
  }, [items, usdSum, users]);

  /* ── 2c. Business Development ── */
  const bdRows = useMemo(() => {
    const map = new Map();
    items.forEach(i => {
      const k = i.bdOwner ? String(i.bdOwner) : 'none';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(i);
    });
    return [...map.entries()].map(([k, list]) => {
      const l = withDates(list);
      const proj = l.filter(i => i.kind === 'project');
      const cons = l.filter(i => i.kind === 'contract');
      return {
        key: k,
        user: k === 'none' ? { name: 'No BD owner' } : (userById(k) || { name: l[0].raw.bdOwnerName || 'Unknown user' }),
        list: l, count: l.length,
        projects: proj.length, contracts: cons.length,
        budget:  usdSum(proj.map(i => i.raw), p => p.budget),
        monthly: usdSum(cons.map(i => i.raw), c => c.monthlyAmount),
      };
    }).sort((a, b) => (a.key === 'none') - (b.key === 'none') || b.budget.total + b.monthly.total - (a.budget.total + a.monthly.total));
  }, [items, usdSum, users]);

  /* ── 3. Page-level numbers (follow the type filter) ── */
  const liveProjects  = items.filter(i => i.kind === 'project');
  const liveContracts = items.filter(i => i.kind === 'contract');
  const overdueAll    = overdueOf(withDates(liveProjects));
  const levelCounts   = LEVELS.map(l => ({ ...l, n: resourceRows.filter(r => r.level.key === l.key).length }));
  const totalBudget   = usdSum(liveProjects.map(i => i.raw), p => p.budget);
  const totalMonthly  = usdSum(liveContracts.map(i => i.raw), c => c.monthlyAmount);
  const upcoming      = withDates(liveProjects).filter(i => i.daysLeft !== null && i.daysLeft >= 0 && i.daysLeft <= 30).sort((a, b) => a.daysLeft - b.daysLeft);

  /* Rate line: which currencies are in use and the rate applied */
  const codesInUse = [...new Set([...liveProjects, ...liveContracts].map(i => (currencyOf(i.raw)?.code || '').toUpperCase()).filter(c => c && c !== 'USD'))];
  const rateInfo = codesInUse.map(c => ({ code: c, fx: usdRates[c] }));
  const rateDate = rateInfo.find(r => r.fx?.date && r.fx.source !== 'last payment')?.fx.date;

  /* Resource list filters */
  const roleOptions = [...new Set(resourceRows.map(r => r.user.role).filter(Boolean))];
  const shownResources = resourceRows.filter(r =>
    (levelFilter === 'all' || r.level.key === levelFilter) &&
    (roleFilter === 'all' || r.user.role === roleFilter) &&
    (!search.trim() || r.user.name.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const refreshRates = async () => { setRefreshing(true); await loadUsdRates(); setRefreshing(false); };

  if (dataLoading) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height:90, background:'var(--bg-card)', borderRadius:13, border:'1px solid var(--border)', opacity:0.5 }}/>)}
      </div>
    );
  }

  const money = (sum, suffix = '') => (
    <span title={sum.missing.length ? `${sum.missing.length} item(s) not included: no exchange rate for their currency right now` : 'Converted to US $ at today\'s live rate'}>
      {fmtUsd(sum.total)}{suffix}{sum.missing.length > 0 && <span style={{ color:'var(--warning)', fontWeight:700 }}> *</span>}
    </span>
  );
  const anyMissing = totalBudget.missing.length + totalMonthly.missing.length > 0;

  return (
    <div className="fade-in">
      <PageHeader
        sub="Who is working on what right now — based on live projects and Digital contracts"
        action={
          <button onClick={() => setShowHelp(s => !s)} style={btnStyle(showHelp)}>
            <Info size={14}/> How it works
          </button>
        }
      />

      {/* ── How it works ───────────────────────────────────────── */}
      {showHelp && (
        <Card style={{ marginBottom:18, background:'#F5F8FD', border:'1px solid #D5E2F3' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:18 }}>
            <HelpBlock n="1" title="What counts as work">
              Only <b>live</b> work: projects with status <b>Active</b> and Digital contracts with status <b>Active</b>. Completed, on-hold, paused and cancelled items are ignored.
            </HelpBlock>
            <HelpBlock n="2" title="How a person's load is counted">
              One point for each live project or contract where the person is added under <b>Resources</b>. PMs are counted by projects they own, BD by projects and contracts they own.
            </HelpBlock>
            <HelpBlock n="3" title="Load levels">
              {LEVELS.map(l => <span key={l.key} style={{ display:'inline-flex', alignItems:'center', gap:4, marginRight:10 }}><Dot c={l.color}/>{l.label} ({l.hint})</span>)}
            </HelpBlock>
            <HelpBlock n="4" title="Money in US $">
              Budgets and monthly contract values are converted from each project's own currency to <b>US $</b> using <b>today's live exchange rate</b>. Received payments on the Dashboard use the rate saved on the day they were added, so the two can differ slightly.
            </HelpBlock>
          </div>
        </Card>
      )}

      {/* ── Type filter ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:16 }}>
        <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, marginRight:4 }}>SHOW WORK FROM</span>
        {[{ key:'all', label:'All types', color:'#1B2E6B' }, ...Object.entries(TYPE_META).map(([key, m]) => ({ key, ...m }))].map(t => {
          const n = t.key === 'all' ? allItems.length : allItems.filter(i => i.type === t.key).length;
          const on = typeFilter === t.key;
          return (
            <button key={t.key} onClick={() => setType(t.key)} style={{ ...chip(on, t.color) }}>
              {t.label} <span style={{ opacity:0.8, fontWeight:700 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:12, marginBottom:20 }}>
        <Kpi icon={<Briefcase size={16}/>} color="#1B2E6B" bg="#EEF2FA" value={liveProjects.length} label="Live projects"
             sub={money(totalBudget)} subLabel="total budget"/>
        <Kpi icon={<Wrench size={16}/>} color="#1A6B3C" bg="#EDF7F2" value={liveContracts.length} label="Live Digital contracts"
             sub={money(totalMonthly, '/mo')} subLabel="contract value"/>
        <Kpi icon={<UserCheck size={16}/>} color="#2E6DB4" bg="#EDF4FB" value={resourceRows.filter(r => r.count > 0).length} label="Resources assigned"
             sub={`${levelCounts[0].n} available`} subLabel="with no live work"/>
        <Kpi icon={<Flame size={16}/>} color={levelCounts[3].n ? '#9B1C1C' : 'var(--text-muted)'} bg={levelCounts[3].n ? '#FEF2F2' : 'var(--bg-elevated)'} value={levelCounts[3].n} label="Overloaded people"
             sub={`${levelCounts[2].n} busy`} subLabel="3–4 items each"/>
        <Kpi icon={<AlertOctagon size={16}/>} color={overdueAll.length ? 'var(--danger)' : 'var(--text-muted)'} bg={overdueAll.length ? '#FEF2F2' : 'var(--bg-elevated)'} value={overdueAll.length} label="Overdue projects"
             sub={`${upcoming.length} due`} subLabel="in next 30 days"/>
      </div>

      {/* Rate note */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', fontSize:12, color:'var(--text-muted)', margin:'-8px 0 18px' }}>
        <span>💱 All amounts in <b>US $</b>{rateDate ? ` · live rates of ${formatDate(rateDate)}` : ''}:</span>
        {rateInfo.length === 0 && <span>all live work is already in USD.</span>}
        {rateInfo.map(r => (
          <span key={r.code} style={{ padding:'2px 8px', borderRadius:6, background:r.fx ? 'var(--bg-elevated)' : '#FDF3EA', color:r.fx ? 'var(--text-dim)' : 'var(--warning)', fontWeight:600 }}>
            {r.fx ? `1 ${r.code} = $${formatRate(r.fx.rate)}` : `${r.code}: rate unavailable`}
            {r.fx?.source === 'last payment' && (
              <span title="Live rate could not be fetched, so the rate saved on the latest payment in this currency is used" style={{ fontWeight:400, color:'var(--warning)' }}>
                {' '}(last payment rate{r.fx.date ? `, ${formatDate(r.fx.date)}` : ''})
              </span>
            )}
          </span>
        ))}
        <button onClick={refreshRates} disabled={refreshing} title="Fetch the latest rates" style={{ display:'inline-flex', alignItems:'center', gap:4, border:'none', background:'none', color:'#2E6DB4', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}/> Refresh rates
        </button>
        {anyMissing && <span style={{ color:'var(--warning)' }}>* some items are left out because their currency has no rate right now.</span>}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:16, width:'fit-content', flexWrap:'wrap' }}>
        {[
          { key:'resources', label:'Resources (Developers, Designers, QA…)', n: resourceRows.length },
          { key:'pm',        label:'Project Managers',     n: pmRows.filter(r => r.key !== 'none').length },
          { key:'bd',        label:'Business Development', n: bdRows.filter(r => r.key !== 'none').length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:7, border:'none', cursor:'pointer', background:tab===t.key?'#1B2E6B':'transparent', color:tab===t.key?'#fff':'var(--text-muted)', fontSize:14, fontWeight:tab===t.key?700:500, fontFamily:'var(--font-body)' }}>
            {t.label}
            <span style={{ minWidth:20, padding:'1px 7px', borderRadius:10, fontSize:12, fontWeight:700, background:tab===t.key?'rgba(255,255,255,0.22)':'var(--bg-elevated)' }}>{t.n}</span>
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 2fr) minmax(280px, 1fr)', gap:16, alignItems:'start' }}>
        <div>
          {/* ══ RESOURCES ══════════════════════════════════════ */}
          {tab === 'resources' && (
            <Card>
              {/* Load distribution bar (click a level to filter) */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#1B2E6B', marginBottom:8 }}>Team load at a glance</div>
                <div style={{ display:'flex', height:12, borderRadius:6, overflow:'hidden', background:'var(--bg-elevated)' }}>
                  {levelCounts.filter(l => l.n > 0).map(l => (
                    <div key={l.key} title={`${l.label}: ${l.n}`} style={{ width:`${(l.n / Math.max(resourceRows.length, 1)) * 100}%`, background:l.color }}/>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
                  <button onClick={() => setLevel('all')} style={chip(levelFilter === 'all', '#1B2E6B')}>Everyone <b>{resourceRows.length}</b></button>
                  {levelCounts.map(l => (
                    <button key={l.key} onClick={() => setLevel(levelFilter === l.key ? 'all' : l.key)} style={chip(levelFilter === l.key, l.color)} title={l.hint}>
                      <Dot c={levelFilter === l.key ? '#fff' : l.color}/> {l.label} <b>{l.n}</b>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search + role */}
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:180, display:'flex', alignItems:'center', gap:6, padding:'7px 10px', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-card)' }}>
                  <Search size={14} color="var(--text-muted)"/>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a person…" style={{ border:'none', outline:'none', flex:1, fontSize:13, background:'transparent', color:'var(--text)' }}/>
                </div>
                <select value={roleFilter} onChange={e => setRole(e.target.value)} style={{ padding:'7px 10px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, background:'var(--bg-card)', color:'var(--text)' }}>
                  <option value="all">All roles</option>
                  {roleOptions.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>

              {shownResources.length === 0
                ? <EmptyState icon="👤" message="No one matches these filters."/>
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {shownResources.map(r => {
                      const k = `r${r.user.id}`;
                      return (
                        <div key={k} style={{ border:'1px solid var(--border)', borderLeft:`4px solid ${r.level.color}`, borderRadius:9, background:'var(--bg-card)' }}>
                          <div onClick={() => r.count && toggle(k)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:r.count ? 'pointer' : 'default' }}>
                            <span style={{ width:14, color:'var(--text-muted)' }}>{r.count ? (open[k] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : null}</span>
                            <Avatar user={r.user} size={30}/>
                            <div style={{ flex:'1 1 160px', minWidth:0 }}>
                              <div style={{ fontSize:14, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.user.name}</div>
                              <div style={{ fontSize:12, color:roleColor(r.user.role), fontWeight:600 }}>{roleLabel(r.user.role)}</div>
                            </div>
                            <div style={{ flex:'1 1 160px', minWidth:120 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                                <span style={{ color:'var(--text-muted)' }}>
                                  {r.projects} project{r.projects !== 1 ? 's' : ''}{r.contracts ? ` · ${r.contracts} contract${r.contracts !== 1 ? 's' : ''}` : ''}
                                </span>
                                <b style={{ color:r.level.color }}>{r.count}</b>
                              </div>
                              <ProgressBar value={Math.min(100, (r.count / BAR_SCALE) * 100)} color={r.level.color} height={6}/>
                            </div>
                            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end', minWidth:110 }}>
                              {r.overdue > 0 && <Badge label={`${r.overdue} overdue`} color="var(--danger)"/>}
                              {r.dueSoon > 0 && <Badge label={`${r.dueSoon} due ≤14d`} color="var(--warning)"/>}
                              <span style={{ fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:12, background:r.level.bg, color:r.level.color }}>{r.level.label}</span>
                            </div>
                          </div>
                          {open[k] && <ItemList list={r.list} navigate={navigate}/>}
                        </div>
                      );
                    })}
                  </div>
                )}
            </Card>
          )}

          {/* ══ PROJECT MANAGERS ═══════════════════════════════ */}
          {tab === 'pm' && (
            <Card>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Live projects owned by each PM. Budget = sum of those projects' budgets in US $. Progress = average completion.</div>
              {pmRows.length === 0
                ? <EmptyState icon="👤" message="No live projects."/>
                : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {pmRows.map(r => {
                      const k = `pm${r.key}`;
                      return (
                        <div key={k} style={{ border:'1px solid var(--border)', borderRadius:9, background: r.key === 'none' ? '#FFFBF5' : 'var(--bg-card)' }}>
                          <div onClick={() => toggle(k)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', flexWrap:'wrap' }}>
                            {open[k] ? <ChevronDown size={14} color="var(--text-muted)"/> : <ChevronRight size={14} color="var(--text-muted)"/>}
                            <Avatar user={r.user} size={30} bg={r.key === 'none' ? '#A85010' : '#2E6DB4'}/>
                            <div style={{ flex:'1 1 150px', minWidth:0, fontSize:14, fontWeight:700 }}>{r.user.name}</div>
                            <Badge label={`${r.count} project${r.count !== 1 ? 's' : ''}`} color="#2E6DB4"/>
                            {r.overdue > 0 && <Badge label={`${r.overdue} overdue`} color="var(--danger)"/>}
                            <div style={{ display:'flex', alignItems:'center', gap:6, width:130 }}>
                              <ProgressBar value={r.avgCompletion} color="#2E6DB4" height={5}/>
                              <span style={{ fontSize:12, fontWeight:700, color:'#2E6DB4', minWidth:32 }}>{r.avgCompletion}%</span>
                            </div>
                            <span style={{ fontSize:14, fontWeight:700, color:'var(--success)', minWidth:90, textAlign:'right' }}>{money(r.budget)}</span>
                          </div>
                          {open[k] && <ItemList list={r.list} navigate={navigate} showBudget/>}
                        </div>
                      );
                    })}
                  </div>}
            </Card>
          )}

          {/* ══ BUSINESS DEVELOPMENT ═══════════════════════════ */}
          {tab === 'bd' && (
            <Card>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Live projects and Digital contracts owned by each BD. Project budgets and monthly contract values are shown separately, both in US $.</div>
              {bdRows.length === 0
                ? <EmptyState icon="💼" message="No live work."/>
                : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {bdRows.map(r => {
                      const k = `bd${r.key}`;
                      return (
                        <div key={k} style={{ border:'1px solid var(--border)', borderRadius:9, background: r.key === 'none' ? '#FFFBF5' : 'var(--bg-card)' }}>
                          <div onClick={() => toggle(k)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', flexWrap:'wrap' }}>
                            {open[k] ? <ChevronDown size={14} color="var(--text-muted)"/> : <ChevronRight size={14} color="var(--text-muted)"/>}
                            <Avatar user={r.user} size={30} bg={r.key === 'none' ? '#A85010' : '#4C3A9E'}/>
                            <div style={{ flex:'1 1 150px', minWidth:0, fontSize:14, fontWeight:700 }}>{r.user.name}</div>
                            {r.projects > 0 && <Badge label={`${r.projects} project${r.projects !== 1 ? 's' : ''}`} color="#4C3A9E"/>}
                            {r.contracts > 0 && <Badge label={`${r.contracts} contract${r.contracts !== 1 ? 's' : ''}`} color="#1A6B3C"/>}
                            <div style={{ textAlign:'right', minWidth:120 }}>
                              {r.projects > 0 && <div style={{ fontSize:14, fontWeight:700, color:'var(--success)' }}>{money(r.budget)}</div>}
                              {r.contracts > 0 && <div style={{ fontSize:12, fontWeight:700, color:'#1A6B3C' }}>{money(r.monthly, '/mo')}</div>}
                            </div>
                          </div>
                          {open[k] && <ItemList list={r.list} navigate={navigate} showBudget/>}
                        </div>
                      );
                    })}
                  </div>}
            </Card>
          )}
        </div>

        {/* ── Right column: deadlines ─────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {overdueAll.length > 0 && (
            <Card style={{ background:'var(--danger-dim)', border:'1px solid #9B1C1C30' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <AlertOctagon size={15} color="var(--danger)"/>
                <span style={{ fontWeight:700, color:'var(--danger)', fontSize:14 }}>{overdueAll.length} overdue project{overdueAll.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {overdueAll.sort((a, b) => a.daysLeft - b.daysLeft).map(p => (
                  <div key={p.key} onClick={() => navigate(p.link)} style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:13, padding:'6px 10px', borderRadius:6, background:'#fff', cursor:'pointer' }}>
                    <span style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                    <span style={{ color:'var(--danger)', fontWeight:700, whiteSpace:'nowrap' }}>{-p.daysLeft}d late</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#1B2E6B' }}>Upcoming Deadlines</div>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>Next 30 days</span>
            </div>
            {upcoming.length === 0
              ? <EmptyState icon="📅" message="No deadlines in the next 30 days."/>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {upcoming.map(p => {
                    const people = p.resourceIds.map(id => userById(id)).filter(Boolean);
                    return (
                      <div key={p.key} onClick={() => navigate(p.link)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:'var(--bg-elevated)', cursor:'pointer' }}>
                        <div style={{ width:3, height:30, borderRadius:3, background:TYPE_META[p.type].color, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
                            <Calendar size={9}/>{formatDate(p.due)} · {people.length ? people.map(u => u.name.split(' ')[0]).join(', ') : 'no resources'}
                          </div>
                        </div>
                        <Badge label={p.daysLeft === 0 ? 'Today' : `${p.daysLeft}d`} color={p.daysLeft <= 7 ? 'var(--danger)' : p.daysLeft <= 14 ? 'var(--warning)' : 'var(--text-muted)'}/>
                      </div>
                    );
                  })}
                </div>}
          </Card>

          <Card style={{ padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#1B2E6B', marginBottom:6 }}><Users size={14}/> Tip</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
              Click any person to see exactly which projects and contracts make up their load. Someone shows as <b>Available</b> when they are not added as a resource on any live project or contract.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  /* Expanded list of a person's live work */
  function ItemList({ list, navigate, showBudget }) {
    const sorted = [...list].sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));
    return (
      <div style={{ borderTop:'1px solid var(--border)', padding:'8px 12px 10px 38px', display:'flex', flexDirection:'column', gap:6 }}>
        {sorted.map(i => {
          const late = i.daysLeft !== null && i.daysLeft < 0;
          const usd = showBudget
            ? (i.kind === 'project' ? usdSum([i.raw], p => p.budget) : usdSum([i.raw], c => c.monthlyAmount))
            : null;
          return (
            <div key={i.key} onClick={() => navigate(i.link)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, background:'var(--bg-elevated)', cursor:'pointer', flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:5, color:'#fff', background:TYPE_META[i.type].color }}>{TYPE_META[i.type].label}</span>
              <div style={{ flex:'1 1 160px', minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{i.name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{[i.client, i.sub].filter(Boolean).join(' · ')}</div>
              </div>
              {i.completion !== null && <span style={{ fontSize:12, color:'#2E6DB4', fontWeight:700 }}>{i.completion}%</span>}
              {i.due && (
                <span style={{ fontSize:11, color: late ? 'var(--danger)' : 'var(--text-muted)', fontWeight: late ? 700 : 400 }}>
                  {i.dueLabel} {formatDate(i.due)}{late ? ` · ${-i.daysLeft}d late` : ''}
                </span>
              )}
              {usd && <span style={{ fontSize:12, fontWeight:700, color:'var(--success)', minWidth:70, textAlign:'right' }}>{money(usd, i.kind === 'contract' ? '/mo' : '')}</span>}
            </div>
          );
        })}
      </div>
    );
  }
}

/* ── small presentational helpers ─────────────────────────── */
function Kpi({ icon, color, bg, value, label, sub, subLabel }) {
  return (
    <Card style={{ padding:14, borderTop:`3px solid ${color}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{label}</div>
        </div>
      </div>
      <div style={{ marginTop:10, paddingTop:8, borderTop:'1px dashed var(--border)', fontSize:12, color:'var(--text-muted)' }}>
        <b style={{ color:'var(--text)' }}>{sub}</b> {subLabel}
      </div>
    </Card>
  );
}

function HelpBlock({ n, title, children }) {
  return (
    <div style={{ display:'flex', gap:10 }}>
      <div style={{ width:24, height:24, borderRadius:12, background:'#1B2E6B', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{n}</div>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#1B2E6B', marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:12.5, color:'var(--text-dim)', lineHeight:1.6 }}>{children}</div>
      </div>
    </div>
  );
}

const Dot = ({ c }) => <span style={{ display:'inline-block', width:8, height:8, borderRadius:4, background:c }}/>;

function chip(on, color) {
  return {
    display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:16, cursor:'pointer',
    border:`1px solid ${on ? color : 'var(--border)'}`, background:on ? color : 'var(--bg-card)',
    color:on ? '#fff' : 'var(--text-dim)', fontSize:12.5, fontWeight:600, fontFamily:'var(--font-body)',
  };
}
function btnStyle(on) {
  return {
    display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, cursor:'pointer',
    border:'1px solid #2E6DB4', background:on ? '#2E6DB4' : 'var(--bg-card)', color:on ? '#fff' : '#2E6DB4',
    fontSize:13, fontWeight:600, fontFamily:'var(--font-body)',
  };
}
/* Small rates need more digits: 1 INR = $0.01186, 1 AUD = $0.6512 */
function formatRate(r) {
  const n = Number(r);
  if (!(n > 0)) return '—';
  return n >= 1 ? n.toFixed(4) : n.toPrecision(4);
}
