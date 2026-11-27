import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, PageHeader, Table, TR, TD, Badge, formatDate } from '../components/UI';
import { fmtCycleDate } from '../utils/billingCycle';
import { useCyclePayments } from '../utils/cyclePayments';

/* Payments of the CURRENT billing cycle, opened from the Dashboard
   "Payment Status Current Cycle" boxes:  /payments?status=received | pending | overdue
   Uses the same calculation as the Dashboard (utils/cyclePayments.js), so the totals always match. */

const TABS = [
  { key: 'received', label: 'Received', color: 'var(--success)', title: 'Total Received In Current Cycle',        empty: 'No payment has been received in this cycle yet.' },
  { key: 'pending',  label: 'Pending',  color: 'var(--warning)', title: 'Total Pending In Current Cycle',         empty: 'No pending payments in this cycle.' },
  { key: 'overdue',  label: 'Overdue',  color: 'var(--danger)',  title: 'Total Overdue Amount In Current Cycle',  empty: 'No overdue payments in this cycle.' },
];

const DAY = 24 * 60 * 60 * 1000;

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { projects, billingCycle, fmtUsd, usdTotal, fmtPayment, refreshLiveData, dataLoading } = useApp();

  /* same live refresh as the Dashboard, so the list is never older than the boxes */
  useEffect(() => { if (refreshLiveData) refreshLiveData(); }, [refreshLiveData]);

  const status = TABS.some(t => t.key === params.get('status')) ? params.get('status') : 'pending';
  const tab = TABS.find(t => t.key === status);

  const { today, cycle, received, pending, overdue } = useCyclePayments(projects, billingCycle);
  const groups = { received, pending, overdue };
  const amt = (p) => p.amount;

  const rows = [...groups[status]].sort((a, b) => status === 'received'
    ? b.received - a.received                     // latest received first
    : a.due - b.due);                             // earliest due first
  const totals = usdTotal(rows, amt);

  const cycleText = `${fmtCycleDate(cycle.start)} - ${fmtCycleDate(cycle.end)}`;
  const openProject = (p) => navigate(`/projects/${p.projectId}?tab=payments`);

  if (dataLoading) {
    return <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading payments…</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader sub={`Payment Status Current Cycle (${cycleText}) - Web / Mobile project payments`} />

      {/* Summary boxes - same numbers as the Dashboard; click to switch */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {TABS.map(t => {
          const list = groups[t.key];
          const active = t.key === status;
          return (
            <Card key={t.key} hover onClick={() => setParams({ status: t.key })}
              style={{ padding: '14px 16px', cursor: 'pointer', textAlign: 'center', borderTop: `3px solid ${active ? t.color : 'transparent'}`, background: active ? 'var(--bg-elevated)' : undefined }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.color, lineHeight: 1.3 }}>{fmtUsd(usdTotal(list, amt).total)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, opacity: 0.8 }}>{list.length} payment{list.length !== 1 ? 's' : ''}</div>
            </Card>
          );
        })}
      </div>

      {totals.missing > 0 && (
        <div style={{ fontSize: 12, color: 'var(--warning)', background: '#FFF8E6', border: '1px solid #F0D9A0', borderRadius: 7, padding: '7px 10px', marginBottom: 12 }}>
          {totals.missing} older payment{totals.missing !== 1 ? 's have' : ' has'} no USD value saved yet, so {totals.missing !== 1 ? 'they are' : 'it is'} listed below but not included in the USD total.
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table headers={['Project', 'Client', 'Type', 'Amount', 'Amount (USD)', 'Due Date', ...(status === 'received' ? ['Received Date'] : []), 'Status', 'Notes']}>
          {rows.length === 0 && (
            <TR><td colSpan={9} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>{tab.empty}</td></TR>
          )}
          {rows.map(p => {
            const usd = usdTotal([p], amt);
            const daysLate = status === 'overdue' ? Math.round((today - p.due) / DAY) : 0;
            return (
              <TR key={p.id} onClick={() => openProject(p)}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 22, borderRadius: 3, background: p.projectColor || '#2E6DB4', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: '#2E6DB4' }}>{p.projectName}</span>
                  </div>
                </TD>
                <TD><span style={{ color: 'var(--text-muted)' }}>{p.clientName || '—'}</span></TD>
                <TD><span style={{ color: 'var(--text-muted)' }}>{p.type || '—'}</span></TD>
                <TD><strong>{fmtPayment(p, p)}</strong></TD>
                <TD>{usd.missing
                  ? <span title="USD value not saved for this older payment yet" style={{ color: 'var(--text-muted)' }}>USD pending</span>
                  : <strong style={{ color: tab.color }}>{fmtUsd(usd.total)}</strong>}
                </TD>
                <TD><span style={{ color: 'var(--text-muted)' }}>{p.date ? formatDate(p.date) : '—'}</span></TD>
                {status === 'received' && <TD><span style={{ color: 'var(--text-muted)' }}>{p.received ? formatDate(p.receivedDate || p.date) : '—'}</span></TD>}
                <TD>
                  <Badge label={tab.label} color={tab.color} />
                  {daysLate > 0 && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{daysLate} day{daysLate !== 1 ? 's' : ''} late</div>}
                </TD>
                <TD><span style={{ color: 'var(--text-muted)' }}>{p.notes || '—'}</span></TD>
              </TR>
            );
          })}
          {rows.length > 0 && (
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <td colSpan={4} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>Total ({rows.length} payment{rows.length !== 1 ? 's' : ''})</td>
              <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, color: tab.color }}>{fmtUsd(totals.total)}</td>
              <td colSpan={status === 'received' ? 4 : 3} />
            </tr>
          )}
        </Table>
      </Card>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
        Click a row to open that project's Payments tab. Unpaid amounts from earlier cycles are not included, same as the Dashboard.
      </div>
    </div>
  );
}
