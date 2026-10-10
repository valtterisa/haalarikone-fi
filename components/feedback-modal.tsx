'use client';

import { Slot } from '@radix-ui/react-slot';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { FeedbackForm, type FeedbackFormProps } from '@/components/feedback-form';
import { cn } from '@/lib/utils';

type FeedbackModalRootProps = FeedbackFormProps & {
  trigger: ReactElement;
};

export function FeedbackModalRoot({ trigger, ...formProps }: FeedbackModalRootProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => setOpen(false);

  return (
    <>
      <Slot onClick={() => setOpen(true)}>{trigger}</Slot>
      {open ? (
        <FeedbackModal.Panel onClose={close} titleId={titleId}>
          <FeedbackForm
            {...formProps}
            titleId={titleId}
            onClose={close}
            className={cn(formProps.className)}
          />
        </FeedbackModal.Panel>
      ) : null}
    </>
  );
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function FeedbackModalPanel({
  children,
  onClose,
  titleId,
}: {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('feedback');

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    panel?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !panel) return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === panel) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t('close')}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg overflow-y-auto overscroll-contain rounded-xl bg-card p-6 shadow-overlay focus:outline-none"
      >
        {children}
      </div>
    </div>
  );
}

export const FeedbackModal = Object.assign(FeedbackModalRoot, {
  Panel: FeedbackModalPanel,
});
