'use client';

import { useId, useRef, useState, FormEvent } from 'react';
import { Check, Warning } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';
import type { FeedbackType } from '@/lib/feedback-schema';
import { sendFeedback } from '@/lib/send-feedback';

type FeedbackStatus =
  { type: 'idle' } | { type: 'success'; message: string } | { type: 'error'; message: string };

export type FeedbackFormProps = {
  title: string;
  titleId?: string;
  description?: string;
  submitLabel: string;
  className?: string;
  feedbackType?: FeedbackType;
  sourceId?: string;
  sourceName?: string;
  includeEmailField?: boolean;
  messageLabel?: string;
  messagePlaceholder?: string;
  emailPlaceholder?: string;
  onClose?: () => void;
};

export function FeedbackForm({
  title,
  titleId,
  description,
  submitLabel,
  className,
  feedbackType = 'general',
  sourceId,
  sourceName,
  includeEmailField = true,
  messageLabel,
  messagePlaceholder,
  emailPlaceholder,
  onClose,
}: FeedbackFormProps) {
  const t = useTranslations('feedback');
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<FeedbackStatus>({ type: 'idle' });
  const [pending, setPending] = useState(false);
  const id = useId();

  const resolvedMessageLabel = messageLabel ?? t('message');
  const resolvedMessagePlaceholder = messagePlaceholder ?? t('messagePlaceholder');
  const resolvedEmailPlaceholder = emailPlaceholder ?? t('emailPlaceholder');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current || pending) {
      return;
    }

    const formData = new FormData(formRef.current);
    const websiteEntry = formData.get('website');
    const honeypot = typeof websiteEntry === 'string' ? websiteEntry : '';
    if (honeypot) {
      setStatus({ type: 'success', message: t('success') });
      return;
    }

    const messageEntry = formData.get('message');
    const message = typeof messageEntry === 'string' ? messageEntry.trim() : '';

    if (message.length < 10) {
      setStatus({
        type: 'error',
        message: t('validation'),
      });
      return;
    }

    setPending(true);
    setStatus({ type: 'idle' });

    try {
      const emailEntry = formData.get('email');
      const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';

      await sendFeedback({
        type: feedbackType,
        message,
        email: email || null,
        sourceId: sourceId ?? null,
        sourceName: sourceName ?? null,
        pageUrl: window.location.href,
        origin: window.location.origin,
        referer: document.referrer || null,
      });

      setStatus({
        type: 'success',
        message: t('success'),
      });
      formRef.current.reset();
    } catch {
      setStatus({
        type: 'error',
        message: t('error'),
      });
    } finally {
      setPending(false);
    }
  };

  if (status.type === 'success') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="rounded-lg border border-green/30 bg-green/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green/20">
              <Check className="h-5 w-5 text-green" weight="bold" />
            </div>
            <div>
              <h3 className="font-semibold text-green">{t('successTitle')}</h3>
              <p className="text-sm text-muted-foreground">{status.message}</p>
            </div>
          </div>
        </div>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className={cn('relative space-y-4', className)}
    >
      {sourceId ? <input type="hidden" name="sourceId" value={sourceId} /> : null}
      {sourceName ? <input type="hidden" name="sourceName" value={sourceName} /> : null}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input type="text" id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <h3 id={titleId} className="text-lg font-semibold">
          {title}
        </h3>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {status.type === 'error' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <div className="flex items-center gap-2">
            <Warning className="h-4 w-4 text-destructive shrink-0" weight="bold" />
            <p className="text-sm text-destructive">{status.message}</p>
          </div>
        </div>
      )}
      {includeEmailField ? (
        <div className="space-y-2">
          <Label htmlFor={`${id}-email`}>{t('emailLabel')}</Label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            placeholder={resolvedEmailPlaceholder}
            autoComplete="email"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={`${id}-message`}>{resolvedMessageLabel}</Label>
        <textarea
          id={`${id}-message`}
          name="message"
          data-testid="feedback-message"
          required
          minLength={10}
          placeholder={resolvedMessagePlaceholder}
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        />
      </div>
      <div className={cn('flex justify-between gap-3', onClose && 'flex-col sm:flex-row')}>
        <Button
          type="submit"
          disabled={pending}
          className="bg-green text-white hover:bg-green/90"
          data-testid="feedback-submit"
        >
          {pending ? t('submitting') : submitLabel}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        )}
      </div>
    </form>
  );
}
