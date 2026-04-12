'use client';

import { useState, type ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackForm, type FeedbackFormProps } from '@/components/feedback-form';
import { cn } from '@/lib/utils';

type FeedbackModalProps = FeedbackFormProps & {
  triggerLabel: string;
  triggerClassName?: string;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
  triggerSize?: ComponentProps<typeof Button>['size'];
};

export function FeedbackModal({
  triggerLabel,
  triggerClassName,
  triggerVariant,
  triggerSize,
  ...formProps
}: FeedbackModalProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
        variant={triggerVariant}
        size={triggerSize}
        data-testid="feedback-trigger"
      >
        {triggerLabel}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <FeedbackForm {...formProps} onClose={close} className={cn(formProps.className)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
