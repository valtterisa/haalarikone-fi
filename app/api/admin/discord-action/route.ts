import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminActionToken } from '@/lib/admin-action-token';
import { approveClaim, rejectClaim, revokeClaim } from '@/lib/org-claims';

function htmlPage(title: string, body: string, ok: boolean) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | Haalarikone</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 28rem; margin: 4rem auto; padding: 0 1.25rem; color: #111; }
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
      background: ${ok ? '#ecfccb' : '#fee2e2'}; color: ${ok ? '#3f6212' : '#991b1b'}; }
    h1 { font-size: 1.35rem; margin: 0.75rem 0 0.5rem; }
    p { line-height: 1.5; color: #444; }
    a { color: #65a30d; }
  </style>
</head>
<body>
  <span class="badge">${ok ? 'OK' : 'Virhe'}</span>
  <h1>${title}</h1>
  <p>${body}</p>
  <p><a href="https://haalarikone.fi">haalarikone.fi</a></p>
</body>
</html>`,
    {
      status: ok ? 200 : 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return htmlPage('Puuttuva token', 'Toimintolinkistä puuttuu token.', false);
  }

  const payload = verifyAdminActionToken(token);
  if (!payload) {
    return htmlPage('Virheellinen linkki', 'Token on vanhentunut tai virheellinen.', false);
  }

  try {
    if (payload.action === 'approve') {
      await approveClaim(payload.id, 'discord');
      return htmlPage(
        'Hyväksytty',
        `Claim ${payload.id} hyväksytty. Käyttäjälle lähetettiin sähköposti.`,
        true,
      );
    }
    if (payload.action === 'reject') {
      await rejectClaim(payload.id, 'discord');
      return htmlPage(
        'Hylätty',
        `Claim ${payload.id} hylätty. Käyttäjälle lähetettiin sähköposti.`,
        true,
      );
    }
    await revokeClaim(payload.id, 'discord');
    return htmlPage('Peruttu', `Claim ${payload.id} peruttu ja profiili poistettu.`, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return htmlPage('Toiminto epäonnistui', message, false);
  }
}
