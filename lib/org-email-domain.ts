/** Hosts where domain-match auto-approve is unsafe (shared student-union / uni / link-in-bio). */
const SHARED_EMAIL_HOST_DENYLIST = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'yahoo.com',
  'proton.me',
  'protonmail.com',
  'ayy.fi',
  'hyy.fi',
  'tyy.fi',
  'trey.fi',
  'isyy.fi',
  'jyy.fi',
  'oyy.fi',
  'lyy.fi',
  'ltky.fi',
  'helsinki.fi',
  'utu.fi',
  'tuni.fi',
  'aalto.fi',
  'uef.fi',
  'jyu.fi',
  'oulu.fi',
  'abo.fi',
  'lut.fi',
  'ulapland.fi',
  'metropolia.fi',
  'xamk.fi',
  'lab.fi',
  'seamk.fi',
  'savonia.fi',
  'karelia.fi',
  'turkuamk.fi',
  'linktr.ee',
  'linktree.com',
  'instagram.com',
  'facebook.com',
  'bit.ly',
]);

function normalizeHostname(input: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const host = new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, '');
    return host || null;
  } catch {
    return null;
  }
}

function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domain || null;
}

/** True when email domain matches org website host and host is not on the shared deny-list. */
export function emailMatchesOrgWebsite(email: string, website: string | null | undefined): boolean {
  if (!website) return false;

  const domain = emailDomain(email);
  const host = normalizeHostname(website);
  if (!domain || !host) return false;
  if (SHARED_EMAIL_HOST_DENYLIST.has(domain) || SHARED_EMAIL_HOST_DENYLIST.has(host)) {
    return false;
  }

  return domain === host || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`);
}

export function suggestedOrgEmailHint(website: string | null | undefined): string | null {
  const host = website ? normalizeHostname(website) : null;
  if (!host || SHARED_EMAIL_HOST_DENYLIST.has(host)) return null;
  return `hallitus@${host}`;
}
