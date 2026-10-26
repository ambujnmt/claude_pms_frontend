/* Project types used by the sidebar sub-menu, the Projects page filter, the "New Project" form
   and the Dashboard "Active Projects" cards:  Web · Mobile · Digital.
   A project's type is derived from its category name, so it keeps working with whatever
   categories exist on the Categories page. */

export const PROJECT_TYPES = [
  { key: 'web',     label: 'Web',     to: '/projects?type=web' },
  { key: 'mobile',  label: 'Mobile',  to: '/projects?type=mobile' },
  { key: 'digital', label: 'Digital', to: '/maintenance' },      // recurring contracts live on the Digital page
];

export function projectTypeOf(category) {
  const t = (category || '').toLowerCase();
  if (/mobile|\bapp\b|android|ios|flutter|react native/.test(t)) return 'mobile';
  if (/\bseo\b|ppc|digital|marketing|social|\bads?\b|content/.test(t)) return 'digital';
  return 'web';                                                   // Website, AI/ML, anything else on the Projects page
}

/* SEO is a Digital service - it is not offered as a category in the Project form */
export const isSeoCategory = (name) => /\bseo\b/i.test(name || '');

/* First category (not SEO) that belongs to the given type - used to auto-select the category */
export function categoryForType(type, categories) {
  if (!type) return null;
  return (categories || []).filter(c => !isSeoCategory(c.name)).find(c => projectTypeOf(c.name) === type)?.name || null;
}
