'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendClaimInviteAction } from '@/lib/org-profile-actions';

export function AdminInviteForm() {
  const t = useTranslations('admin');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await sendClaimInviteAction(formData);
          setMessage(result.ok ? t('inviteSent') : t('inviteError'));
          if (result.ok) event.currentTarget.reset();
        });
      }}
    >
      <label className="flex-1 space-y-1.5 text-sm">
        <span className="font-medium text-foreground/75">{t('inviteSlug')}</span>
        <Input name="orgSlug" required placeholder="lok-ry" className="h-11" />
      </label>
      <label className="flex-[1.4] space-y-1.5 text-sm">
        <span className="font-medium text-foreground/75">{t('inviteEmail')}</span>
        <Input name="email" type="email" required className="h-11" />
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="h-11 bg-green text-white hover:bg-green/90"
      >
        {t('sendInvite')}
      </Button>
      {message ? (
        <p className="w-full text-sm text-foreground/70 sm:basis-full">{message}</p>
      ) : null}
    </form>
  );
}
