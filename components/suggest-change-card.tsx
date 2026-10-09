'use client';

import { FeedbackModal } from '@/components/feedback-modal';
import type { FeedbackType } from '@/lib/feedback-schema';

type SuggestChangeCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  modalTitle: string;
  modalDescription: string;
  submitLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  sourceId: string;
  sourceName: string;
  feedbackType?: FeedbackType;
};

export default function SuggestChangeCard({
  title,
  description,
  buttonLabel,
  modalTitle,
  modalDescription,
  submitLabel,
  messageLabel,
  messagePlaceholder,
  sourceId,
  sourceName,
  feedbackType = 'correction',
}: SuggestChangeCardProps) {
  return (
    <div className="mt-10 rounded-xl border border-border/60 bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <FeedbackModal
          trigger={
            <button
              type="button"
              className="flex-shrink-0 rounded-md bg-green px-4 py-2 text-white hover:bg-green/90"
              data-testid="feedback-trigger"
            >
              {buttonLabel}
            </button>
          }
          title={modalTitle}
          description={modalDescription}
          submitLabel={submitLabel}
          feedbackType={feedbackType}
          sourceId={sourceId}
          sourceName={sourceName}
          messageLabel={messageLabel}
          messagePlaceholder={messagePlaceholder}
        />
      </div>
    </div>
  );
}
