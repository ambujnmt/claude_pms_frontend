import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Field } from './UI';
import UserMultiSelect from './UserMultiSelect';

/* Project / Digital-project "Resources" field.
 *  - Rendered ONLY for managers (Super Admin, Management, PM, Team Lead, Account Manager).
 *  - Nothing is listed until a PM Owner is selected; then only the members who report to that
 *    PM (Team page -> "Reports to") are offered.
 *  - Changing the PM Owner drops the selected resources that are not in the new PM's team.
 *  - Resources already on an older record from outside the team stay visible (and removable).
 *  Server-side the managers' own-team rule is still enforced, so hiding this field is not the only protection. */
export default function ResourcePicker({ value, onChange, pmOwner, label = 'Resources (developers, designers, QA, etc.)' }) {
  const { canAssignResources, resourceOptions } = useApp();
  const selected = value || [];

  const team = pmOwner ? resourceOptions.filter(u => String(u.managerId) === String(pmOwner)) : [];

  /* PM Owner changed by the user (not the first render) -> keep only the new PM's team members */
  const prevPm = useRef(pmOwner);
  useEffect(() => {
    if (String(prevPm.current || '') === String(pmOwner || '')) return;
    prevPm.current = pmOwner;
    const teamIds = team.map(u => u.id);
    const kept = selected.filter(id => teamIds.includes(id));
    if (kept.length !== selected.length) onChange(kept);
  }, [pmOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canAssignResources) return null;

  if (!pmOwner) {
    return (
      <Field label={label}>
        <div style={{ padding: '10px 12px', borderRadius: 7, border: '1.5px dashed var(--border-bright)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 13 }}>
          Select a PM Owner first to assign resources.
        </div>
      </Field>
    );
  }

  /* already-selected members from outside the team (older records) stay listed so they can be seen / removed */
  const extra = resourceOptions.filter(u => selected.includes(u.id) && !team.some(t => t.id === u.id));
  const options = [...team, ...extra];

  return (
    <Field label={label}>
      <UserMultiSelect
        users={options}
        value={selected}
        onChange={onChange}
        placeholder="Search this PM's team members…"
      />
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
        {team.length === 0
          ? 'No team members report to this PM. Set “Reports to” on the Team page.'
          : 'Showing only the members who report to the selected PM Owner.'}
      </div>
    </Field>
  );
}
