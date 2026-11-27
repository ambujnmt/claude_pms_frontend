import { useEffect, useMemo, useState } from 'react';
import { resolveCycle, toLocalDate } from './billingCycle';

/* Shared by the Dashboard "Payment Status Current Cycle" card and the Payments page,
   so both always show exactly the same payments and totals. */

const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };

/* "today" at midnight; refreshes itself if the tab stays open past midnight */
export function useToday() {
  const [today, setToday] = useState(startOfToday);
  useEffect(() => {
    const id = setInterval(() => setToday(prev => { const n = startOfToday(); return n.getTime() === prev.getTime() ? prev : n; }), 60000);
    return () => clearInterval(id);
  }, []);
  return today;
}

/* Each payment has two dates:
     due      = the Due Date typed by the user
     received = the day it was marked "received" (saved automatically; older rows fall back to the due date)
   The cycle date ("cycleDate") is the RECEIVED date for received payments and the DUE date for the rest. */
export function flattenPayments(projects) {
  return (projects || []).flatMap(p => (p.payments || [])
    .filter(pay => pay.date || pay.receivedDate)
    .map(pay => {
      const due      = pay.date ? toLocalDate(pay.date) : null;
      const received = pay.status === 'received' ? (pay.receivedDate ? toLocalDate(pay.receivedDate) : due) : null;
      return {
        ...pay, due, received, cycleDate: received || due,
        projectName: p.name, projectId: p.id, projectColor: p.color, clientName: p.client,
        currency: p.currency, currencyId: p.currencyId, amountUsd: pay.amountUsd,
      };
    })
    .filter(pay => pay.cycleDate));
}

/* Only payments inside the cycle (start <= date < end):
     received = marked received, RECEIVED DATE in this cycle
     pending  = not received, due date in this cycle, due today or later
     overdue  = not received, due date in this cycle, due before today
   Unpaid money from EARLIER cycles is returned separately (earlierOverdue). */
export function splitCyclePayments(allPayments, cycle, today) {
  const inCycle = (p) => p.cycleDate >= cycle.start && p.cycleDate < cycle.end;
  const cyclePayments = allPayments.filter(inCycle);
  return {
    received:       cyclePayments.filter(p => p.status === 'received'),
    pending:        cyclePayments.filter(p => p.status !== 'received' && p.due >= today),
    overdue:        cyclePayments.filter(p => p.status !== 'received' && p.due < today),
    earlierOverdue: allPayments.filter(p => p.status !== 'received' && p.due && p.due < cycle.start),
  };
}

/* Everything the dashboard card and the Payments page need, in one hook */
export function useCyclePayments(projects, billingCycle) {
  const today = useToday();
  const cycle = useMemo(() => resolveCycle(billingCycle, today), [billingCycle, today]);
  const allPayments = useMemo(() => flattenPayments(projects), [projects]);
  const groups = useMemo(() => splitCyclePayments(allPayments, cycle, today), [allPayments, cycle, today]);
  return { today, cycle, ...groups };
}
