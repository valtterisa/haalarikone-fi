'use client';

import { useId, useRef, useState, FormEvent } from 'react';
import { Check, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';
import { sendFeedbackEmail } from '@/lib/send-feedback-email';

type FeedbackStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export type FeedbackFormProps = {
  title: string;
  titleId?: string;
  description?: string;
  submitLabel: string;
  className?: string;
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
  sourceId,
  sourceName,
  includeEmailField = true,
  messageLabel = 'Viesti',
  messagePlaceholder = 'Kerro ajatuksesi...',
  emailPlaceholder = 'sina@example.com',
  onClose,
}: FeedbackFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<FeedbackStatus>({ type: 'idle' });
  const [pending, setPending] = useState(false);
  const id = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current || pending) {
      return;
    }

    const formData = new FormData(formRef.current);
    const websiteEntry = formData.get('website');
    const honeypot = typeof websiteEntry === 'string' ? websiteEntry : '';
    if (honeypot) {
      setStatus({ type: 'success', message: 'Kiitos palautteesta!' });
      return;
    }

    const messageEntry = formData.get('message');
    const message = typeof messageEntry === 'string' ? messageEntry.trim() : '';

    if (message.length < 10) {
      setStatus({
        type: 'error',
        message: 'Täytä pakolliset kentät ja kerro hieman tarkemmin.',
      });
      return;
    }

    setPending(true);
    setStatus({ type: 'idle' });

    try {
      const emailEntry = formData.get('email');
      const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';

      await sendFeedbackEmail({
        type: 'general',
        message,
        email: email || null,
        sourceId: sourceId ?? null,
        sourceName: sourceName ?? null,
        origin: window.location.origin,
        referer: document.referrer || null,
      });

      setStatus({
        type: 'success',
        message: 'Kiitos palautteesta!',
      });
      formRef.current.reset();
    } catch {
      setStatus({
        type: 'error',
        message: 'Palautteen lähetys epäonnistui, yritä hetken päästä uudelleen.',
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
              <h3 className="font-semibold text-green">Palaute lähetetty!</h3>
              <p className="text-sm text-muted-foreground">{status.message}</p>
            </div>
          </div>
        </div>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Sulje
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
          <Label htmlFor={`${id}-email`}>Sähköposti (vapaaehtoinen)</Label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            placeholder={emailPlaceholder}
            autoComplete="email"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={`${id}-message`}>{messageLabel}</Label>
        <textarea
          id={`${id}-message`}
          name="message"
          data-testid="feedback-message"
          required
          minLength={10}
          placeholder={messagePlaceholder}
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
          {pending ? 'Lähetetään...' : submitLabel}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Sulje
          </Button>
        )}
      </div>
    </form>
  );
}
