'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateOrganizationProfileAction } from '@/lib/org-profile-actions';
import type { OrganizationProfileRow } from '@/lib/org-profile';
import { parseStyles } from '@/lib/utils';
import { SpinnerGap } from '@phosphor-icons/react';

type OrgProfileEditorProps = {
  profile: OrganizationProfileRow;
  fallbackName: string;
  fallbackHex: string;
  embedSnippet: string;
};

export function OrgProfileEditor({
  profile,
  fallbackName,
  fallbackHex,
  embedSnippet,
}: OrgProfileEditorProps) {
  const t = useTranslations('editor');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const initialHex = profile.hex ?? fallbackHex.match(/#([0-9A-Fa-f]{6})/)?.[0] ?? '#65a30d';
  const [hex, setHex] = useState(initialHex);
  const [textColor, setTextColor] = useState(profile.textColor ?? 'white');

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        formData.set('orgSlug', profile.orgSlug);
        formData.set('hex', hex);
        formData.set('textColor', textColor);
        startTransition(async () => {
          const result = await updateOrganizationProfileAction(formData);
          setMessage(result.ok ? t('saved') : t('saveError'));
        });
      }}
    >
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t('profileSection')}</h2>
        <Field label={t('displayName')}>
          <Input
            name="displayName"
            defaultValue={profile.displayName ?? fallbackName}
            className="h-11"
          />
        </Field>
        <Field label={t('website')}>
          <Input name="website" type="url" defaultValue={profile.website ?? ''} className="h-11" />
        </Field>
        <Field label={t('instagram')}>
          <Input
            name="instagramUrl"
            type="url"
            defaultValue={profile.instagramUrl ?? ''}
            className="h-11"
          />
        </Field>
        <Field label={t('discord')}>
          <Input
            name="discordUrl"
            type="url"
            defaultValue={profile.discordUrl ?? ''}
            className="h-11"
          />
        </Field>
        <Field label={t('descriptionFi')}>
          <textarea
            name="descriptionFi"
            rows={4}
            defaultValue={profile.descriptionFi ?? ''}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t('descriptionEn')}>
          <textarea
            name="descriptionEn"
            rows={3}
            defaultValue={profile.descriptionEn ?? ''}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t('descriptionSv')}>
          <textarea
            name="descriptionSv"
            rows={3}
            defaultValue={profile.descriptionSv ?? ''}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t('colorSection')}</h2>
        <Field label={t('variLabel')}>
          <Input name="variLabel" defaultValue={profile.variLabel ?? ''} className="h-11" />
        </Field>
        <Field label={t('variBase')}>
          <Input
            name="variBase"
            defaultValue={
              profile.variBaseJson ? (JSON.parse(profile.variBaseJson) as string[]).join(', ') : ''
            }
            placeholder="vihreä, musta"
            className="h-11"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('hex')}>
            <Input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-11 font-mono"
            />
          </Field>
          <Field label={t('textColor')}>
            <select
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="white">{t('textWhite')}</option>
              <option value="black">{t('textBlack')}</option>
            </select>
          </Field>
        </div>
        <div
          className="h-16 overflow-hidden rounded-xl border border-border"
          style={parseStyles(`background: ${hex}; color: ${textColor};`)}
          aria-hidden
        />
      </section>

      <Button type="submit" disabled={pending} className="bg-green text-white hover:bg-green/90">
        {pending ? (
          <>
            <SpinnerGap className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {t('saving')}
          </>
        ) : (
          t('save')
        )}
      </Button>
      {message ? <p className="text-sm text-foreground/70">{message}</p> : null}

      <section className="rounded-xl border border-border bg-muted/20 p-4">
        <h2 className="text-sm font-semibold tracking-tight">{t('embedTitle')}</h2>
        <p className="mt-1 text-xs text-foreground/60">{t('embedBody')}</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 text-xs text-foreground/80">
          {embedSnippet}
        </pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await navigator.clipboard.writeText(embedSnippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? t('copied') : t('copyEmbed')}
        </Button>
      </section>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground/75">{label}</span>
      {children}
    </label>
  );
}
