import { getCloudflareContext } from '@opennextjs/cloudflare';
import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import { OG_THEME } from '@/lib/og/og-theme';
import type { OgPayload, OrganizationOgPayload, UniversityOgPayload } from '@/lib/og/types';
import { OG_SIZE } from '@/lib/og/types';

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
};

const OG_FONT_ASSETS = {
  regular: '/og-fonts/Arvo-Regular.ttf',
  bold: '/og-fonts/Arvo-Bold.ttf',
} as const;

let fontsPromise: Promise<OgFont[]> | null = null;
let fontsOrigin: string | undefined;

async function readFontFromPublic(assetPath: string): Promise<ArrayBuffer> {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const fileName = assetPath.split('/').pop()!;
  const buffer = await readFile(join(process.cwd(), 'public', 'og-fonts', fileName));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function loadFontFromAssets(assetPath: string): Promise<ArrayBuffer | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.ASSETS) return null;

    const response = await env.ASSETS.fetch(new URL(assetPath, 'https://assets.local'));
    if (!response.ok) return null;
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

async function loadFontAsset(assetPath: string, requestUrl?: string): Promise<ArrayBuffer> {
  const fromAssets = await loadFontFromAssets(assetPath);
  if (fromAssets) return fromAssets;

  if (requestUrl) {
    try {
      const response = await fetch(new URL(assetPath, requestUrl));
      if (response.ok) {
        return response.arrayBuffer();
      }
    } catch {
      // Fall back to the on-disk public copy (Vitest/local Node).
    }
  }

  return readFontFromPublic(assetPath);
}

export async function loadOgFonts(requestUrl?: string) {
  const cacheKey = requestUrl ?? 'local-disk';

  if (!fontsPromise || fontsOrigin !== cacheKey) {
    fontsOrigin = cacheKey;
    fontsPromise = Promise.all([
      loadFontAsset(OG_FONT_ASSETS.regular, requestUrl),
      loadFontAsset(OG_FONT_ASSETS.bold, requestUrl),
    ]).then(([regular, bold]) => [
      { name: 'Arvo', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Arvo', data: bold, weight: 700 as const, style: 'normal' as const },
    ]);
  }

  return fontsPromise;
}

function BrandMark({ brand }: { brand: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 18,
          height: 18,
          borderRadius: 999,
          backgroundColor: OG_THEME.green,
        }}
      />
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: OG_THEME.ink,
        }}
      >
        {brand}
      </div>
    </div>
  );
}

function MetaLine({ parts }: { parts: string[] }) {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        fontSize: 28,
        color: OG_THEME.muted,
      }}
    >
      {filtered.map((part, index) => (
        <div key={`${part}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {index > 0 ? (
            <div
              style={{
                display: 'flex',
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: OG_THEME.border,
              }}
            />
          ) : null}
          <span>{part}</span>
        </div>
      ))}
    </div>
  );
}

function OrganizationCard({ payload }: { payload: OrganizationOgPayload }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: OG_THEME.cream,
        fontFamily: 'Arvo',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 440,
          height: '100%',
          padding: 44,
          backgroundColor: payload.colorHex,
          color: payload.textOnColor,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          {payload.colorCaption}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              fontSize:
                payload.colorLabel.length > 16 ? 36 : payload.colorLabel.length > 11 ? 42 : 54,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
            }}
          >
            {payload.colorLabel}
          </div>
          <div
            style={{
              display: 'flex',
              width: 96,
              height: 10,
              borderRadius: 999,
              backgroundColor: payload.textOnColor,
              opacity: 0.35,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          backgroundImage: `linear-gradient(145deg, ${OG_THEME.cream} 0%, ${OG_THEME.creamDeep} 100%)`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BrandMark brand={payload.brand} />
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: OG_THEME.green,
              }}
            >
              {payload.eyebrow}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                fontSize: payload.title.length > 28 ? 54 : 68,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: OG_THEME.ink,
                maxWidth: 620,
              }}
            >
              {payload.title}
            </div>
            <div
              style={{
                display: 'flex',
                width: 120,
                height: 14,
                borderRadius: 4,
                backgroundColor: OG_THEME.green,
              }}
            />
            <MetaLine parts={[payload.university, payload.area ?? '', payload.field ?? '']} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: OG_THEME.muted,
          }}
        >
          <span>haalarikone.fi</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 18px',
              borderRadius: 999,
              backgroundColor: OG_THEME.greenSoft,
              color: OG_THEME.ink,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: payload.colorHex,
                border: `1px solid ${OG_THEME.border}`,
              }}
            />
            {payload.colorLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function UniversityCard({ payload }: { payload: UniversityOgPayload }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '52px 56px 48px',
        backgroundColor: OG_THEME.cream,
        backgroundImage: `linear-gradient(160deg, ${OG_THEME.cream} 0%, ${OG_THEME.creamDeep} 55%, ${OG_THEME.greenSoft} 160%)`,
        fontFamily: 'Arvo',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BrandMark brand={payload.brand} />
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: OG_THEME.green,
            }}
          >
            {payload.eyebrow}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontSize: payload.title.length > 32 ? 58 : 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: OG_THEME.ink,
              maxWidth: 980,
            }}
          >
            {payload.title}
          </div>
          <div
            style={{
              display: 'flex',
              width: 140,
              height: 14,
              borderRadius: 4,
              backgroundColor: OG_THEME.green,
            }}
          />
          <MetaLine parts={[payload.overallCountLabel, payload.colorCountLabel]} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div
          style={{
            display: 'flex',
            overflow: 'hidden',
            width: '100%',
            height: 120,
            borderRadius: 24,
            border: `1px solid ${OG_THEME.border}`,
            backgroundColor: OG_THEME.white,
          }}
        >
          {payload.swatches.length > 0 ? (
            payload.swatches.map((hex) => (
              <div
                key={hex}
                style={{
                  display: 'flex',
                  flex: 1,
                  height: '100%',
                  backgroundColor: hex,
                }}
              />
            ))
          ) : (
            <div
              style={{
                display: 'flex',
                flex: 1,
                height: '100%',
                backgroundColor: OG_THEME.green,
              }}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            color: OG_THEME.muted,
          }}
        >
          <span>haalarikone.fi</span>
        </div>
      </div>
    </div>
  );
}

export function OgImageElement({ payload }: { payload: OgPayload }): ReactElement {
  if (payload.kind === 'organization') {
    return <OrganizationCard payload={payload} />;
  }
  return <UniversityCard payload={payload} />;
}

export async function renderOgImage(
  payload: OgPayload,
  requestUrl?: string,
): Promise<ImageResponse> {
  const fonts = await loadOgFonts(requestUrl);
  return new ImageResponse(<OgImageElement payload={payload} />, {
    ...OG_SIZE,
    fonts,
  });
}
