/* PM Owner dropdown: only users with the Project Manager role.
   When editing an older project whose PM Owner is someone else (e.g. Management / Super Admin),
   that person is kept in the list, marked "(not a PM)", so opening and saving the form never
   silently changes or clears the existing owner. */
export const PM_OWNER_ROLES = ['pm'];

export function pmOwnerOptions(users, currentId) {
  const list = (users || []).filter(u => PM_OWNER_ROLES.includes(u.role) && u.is_active !== false);
  if (currentId && !list.some(u => String(u.id) === String(currentId))) {
    const cur = (users || []).find(u => String(u.id) === String(currentId));
    if (cur) list.push({ ...cur, name: `${cur.name} (not a PM)` });
  }
  return list;
}
