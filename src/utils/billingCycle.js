/* Billing cycle helpers (office cycle runs 15th -> 15th by default).
   A cycle covers  start <= date < end  (end = the day the next cycle starts). */

export const toLocalDate = (str) => {
  const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* automatic 15th -> 15th cycle that contains `today` */
export function autoCycle(today) {
  const start = today.getDate() >= 15 ? new Date(today.getFullYear(), today.getMonth(), 15) : new Date(today.getFullYear(), today.getMonth() - 1, 15);
  const end   = new Date(start.getFullYear(), start.getMonth() + 1, 15);
  return { start, end };
}

/* The cycle the dashboard uses:
   - the one saved in Settings, as long as it has not ended yet
   - otherwise (nothing saved, or the saved one is over) the automatic 15th -> 15th cycle */
export function resolveCycle(stored, today) {
  if (stored?.start && stored?.end) {
    const start = toLocalDate(stored.start), end = toLocalDate(stored.end);
    if (!isNaN(start) && !isNaN(end) && end > start && today < end) return { start, end, source: 'custom' };
  }
  return { ...autoCycle(today), source: 'auto' };
}

export const fmtCycleDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
