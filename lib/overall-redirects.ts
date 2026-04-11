import overallData from '../data/overall_colors_upstash.json';

type Row = { id: string; content?: { ainejarjestoSlug?: string } };

export function buildOverallRedirects() {
  const rules: { source: string; destination: string; permanent: boolean }[] = [];
  const rows = overallData as Row[];
  for (const row of rows) {
    const id = row.id;
    const slug = row.content?.ainejarjestoSlug?.trim();
    if (!slug) continue;
    rules.push({ source: `/haalari/${id}`, destination: `/haalari/${slug}`, permanent: true });
    rules.push({
      source: `/en/overall/${id}`,
      destination: `/en/overall/${slug}`,
      permanent: true,
    });
    rules.push({
      source: `/sv/overaller/${id}`,
      destination: `/sv/overaller/${slug}`,
      permanent: true,
    });
    rules.push({
      source: `/sv/overall/${id}`,
      destination: `/sv/overaller/${slug}`,
      permanent: true,
    });
  }
  rules.push({
    source: '/sv/overall/:path*',
    destination: '/sv/overaller/:path*',
    permanent: true,
  });
  rules.push({
    source: '/en/haalari/:path*',
    destination: '/en/overall/:path*',
    permanent: true,
  });
  rules.push({
    source: '/sv/haalari/:path*',
    destination: '/sv/overaller/:path*',
    permanent: true,
  });
  return rules;
}
