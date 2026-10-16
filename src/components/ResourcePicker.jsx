import { useApp } from '../context/AppContext';
import { Field } from './UI';
import UserMultiSelect from './UserMultiSelect';

/* Project / Digital-project "Resources" field.
 *  - Rendered ONLY for managers (Super Admin, Management, PM, Team Lead, Account Manager).
 *  - A PM / Team Lead / Account Manager picks from their own team only (GET /my-team);
 *    Super Admin / Management see every assignable member.
 *  Server-side the same rule is enforced, so hiding this field is not the only protection. */
export default function ResourcePicker({ value, onChange, label = 'Resources (developers, designers, QA, etc.)' }) {
  const { canAssignResources, resourceOptions, user } = useApp();
  if (!canAssignResources) return null;

  const adminView = ['super_admin', 'management'].includes(user?.role);

  return (
    <Field label={label}>
      <UserMultiSelect
        users={resourceOptions}
        value={value || []}
        onChange={onChange}
        placeholder={adminView ? 'Search team members to assign…' : 'Search your team members…'}
      />
      {!adminView && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          {resourceOptions.length === 0
            ? 'No team members are assigned to you yet. Ask an admin to set “Reports to” on the Team page.'
            : 'Showing only the members of your team.'}
        </div>
      )}
    </Field>
  );
}
