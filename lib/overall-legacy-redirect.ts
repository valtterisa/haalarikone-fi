import overallData from '../data/overall_data.json';

type Row = { id: string; content?: { ainejarjestoSlug?: string } };

const idToSlug = new Map<string, string>();
for (const row of overallData as Row[]) {
  const slug = row.content?.ainejarjestoSlug?.trim();
  if (!slug) continue;
  idToSlug.set(row.id, slug);
}

function trimTrailingSlash(p: string): string {
  if (p.length > 1 && p.endsWith('/')) {
    return p.slice(0, -1);
  }
  return p;
}

export function resolveOverallLegacyRedirectPath(pathname: string): string | null {
  const request = trimTrailingSlash(pathname);
  let p = request;

  if (p.startsWith('/sv/overall/')) {
    p = '/sv/overaller/' + p.slice('/sv/overall/'.length);
  } else if (p.startsWith('/en/haalari/')) {
    p = '/en/overall/' + p.slice('/en/haalari/'.length);
  } else if (p.startsWith('/sv/haalari/')) {
    p = '/sv/overaller/' + p.slice('/sv/haalari/'.length);
  } else if (p.startsWith('/fi/haalari/')) {
    p = '/haalari/' + p.slice('/fi/haalari/'.length);
  }

  const prefixes = ['/haalari/', '/en/overall/', '/sv/overaller/'] as const;
  for (const prefix of prefixes) {
    if (!p.startsWith(prefix)) continue;
    const after = p.slice(prefix.length);
    const slashIdx = after.indexOf('/');
    const seg = slashIdx === -1 ? after : after.slice(0, slashIdx);
    const tail = slashIdx === -1 ? '' : after.slice(slashIdx);
    if (!seg) return null;
    const mapped = idToSlug.get(seg);
    const newSeg = mapped ?? seg;
    p = prefix + newSeg + tail;
    break;
  }

  return p !== request ? p : null;
}
