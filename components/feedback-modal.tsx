'use client';

import { Slot } from '@radix-ui/react-slot';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  FeedbackForm,
  type FeedbackFormProps,
} from '@/components/feedback-form';
import { cn } from '@/utils/cn';

type FeedbackModalRootProps = FeedbackFormProps & {
  trigger: ReactElement;
};

function FeedbackModalRoot({ trigger, ...formProps }: FeedbackModalRootProps) {
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

function FeedbackModalPanel({
  children,
  onClose,
  titleId,
}: {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
        aria-label="Close"
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
