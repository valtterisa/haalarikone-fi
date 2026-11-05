import { describe, expect, it } from 'vitest';
import { emailMatchesOrgWebsite, suggestedOrgEmailHint } from '@/lib/org-email-domain';

describe('emailMatchesOrgWebsite', () => {
  it('matches distinctive org domains', () => {
    expect(emailMatchesOrgWebsite('hallitus@lok.fi', 'https://www.lok.fi')).toBe(true);
    expect(emailMatchesOrgWebsite('info@lok.fi', 'https://lok.fi/yhteystiedot')).toBe(true);
  });

  it('rejects shared and free-mail domains', () => {
    expect(emailMatchesOrgWebsite('board@ayy.fi', 'https://ayy.fi')).toBe(false);
    expect(emailMatchesOrgWebsite('me@gmail.com', 'https://lok.fi')).toBe(false);
    expect(emailMatchesOrgWebsite('a@lok.fi', 'https://linktr.ee/lok')).toBe(false);
  });

  it('rejects missing website', () => {
    expect(emailMatchesOrgWebsite('a@lok.fi', null)).toBe(false);
  });
});

describe('suggestedOrgEmailHint', () => {
  it('suggests hallitus@host for distinctive sites', () => {
    expect(suggestedOrgEmailHint('https://www.lok.fi')).toBe('hallitus@lok.fi');
  });

  it('returns null for shared hosts', () => {
    expect(suggestedOrgEmailHint('https://ayy.fi')).toBeNull();
  });
});
