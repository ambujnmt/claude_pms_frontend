/* Friendly, plain-language validation for the Client form (used by Clients page + Client detail edit).
   Mirrors the Laravel rules in ValidatesClientContacts so the user sees the same wording either way. */

/* "example.com" -> "https://example.com". Keeps http://, paths, ports, queries. */
export function normalizeWebsite(v) {
  const s = (v || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return 'https:' + s;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : 'https://' + s;
}

export function isValidWebsite(v) {
  const s = normalizeWebsite(v);
  if (!s) return true;                                   // optional
  if (/\s/.test(s)) return false;
  let u;
  try { u = new URL(s); } catch { return false; }
  if (!['http:', 'https:', 'ftp:'].includes(u.protocol)) return false;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return true;
  return /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+[\p{L}\p{N}-]{2,}$/u.test(host);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digits = (v) => (v || '').replace(/\D/g, '');
const phoneShape = (v) => /^[+\d\s().\-/]+$/.test((v || '').trim());

export const MSG = {
  name:        'Please enter the company name.',
  email:       'Please enter a valid email address, like name@company.com.',
  altEmail:    'Please enter a valid alternate email address, like name@company.com.',
  altEmailSame:'The alternate email must be different from the primary email.',
  phone:       'Please enter a valid phone number with 7 to 15 digits. You may start with a country code, like +91 98765 43210. Letters are not allowed.',
  altPhone:    'Please enter a valid alternate phone number with 7 to 15 digits, like +91 98765 43210. Letters are not allowed.',
  altPhoneSame:'The alternate phone must be different from the primary phone.',
  website:     'Please enter a valid website address, for example: example.com or https://www.example.com',
};

export function validateClientForm(f) {
  const e = {};
  if (!(f.name || '').trim()) e.name = MSG.name;
  else if (f.name.trim().length > 255) e.name = 'The company name is too long. Please keep it under 255 characters.';

  const em = (f.email || '').trim();
  const ae = (f.alternateEmail || '').trim();
  if (em && !EMAIL.test(em)) e.email = MSG.email;
  if (ae && !EMAIL.test(ae)) e.alternateEmail = MSG.altEmail;
  else if (em && ae && em.toLowerCase() === ae.toLowerCase()) e.alternateEmail = MSG.altEmailSame;

  const ph = (f.phone || '').trim();
  const ap = (f.alternatePhone || '').trim();
  const phoneOk = (v) => phoneShape(v) && digits(v).length >= 7 && digits(v).length <= 15;
  if (ph && !phoneOk(ph)) e.phone = MSG.phone;
  if (ap && !phoneOk(ap)) e.alternatePhone = MSG.altPhone;
  else if (ph && ap && digits(ph) === digits(ap)) e.alternatePhone = MSG.altPhoneSame;

  if (!isValidWebsite(f.website)) e.website = MSG.website;
  else if ((f.website || '').length > 255) e.website = 'The website address is too long. Please keep it under 255 characters.';

  if ((f.city || '').length > 255) e.city = 'City/Country is too long. Please keep it under 255 characters.';
  if ((f.address || '').length > 1000) e.address = 'The address is too long. Please keep it under 1000 characters.';
  return e;
}
