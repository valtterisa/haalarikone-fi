'use client';

import { useState, useEffect, useRef, useDeferredValue, type ReactNode } from 'react';
import Image from 'next/image';
import type { University } from '@/types/university';
import UniversityCard from '@/components/university-card';
import { useTranslations } from 'next-intl';
import type { HubSource } from '@/lib/analytics-events';

interface ResultsDisplayProps {
  results: University[];
  initialVisibleCount?: number;
  source?: HubSource;
  children?: ReactNode;
}

export function ResultsDisplayRoot({
  results,
  initialVisibleCount,
  source = 'search',
  children,
}: ResultsDisplayProps) {
  const t = useTranslations('search');
  const deferredResults = useDeferredValue(results);
  const isStale = deferredResults !== results;
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const resultsPerPage = 15;
  const resultsDivRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(1);
  const hasPreviewMode = typeof initialVisibleCount === 'number' && initialVisibleCount > 0;
  const shouldShowPreview = hasPreviewMode && !showAll;
  const visiblePreviewCount = initialVisibleCount ?? 0;
  const totalPages = Math.ceil(deferredResults.length / resultsPerPage);

  const visibleResults = shouldShowPreview
    ? deferredResults.slice(0, visiblePreviewCount)
    : deferredResults.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    setShowAll(false);
    prevPageRef.current = 1;
  }, [results]);

  useEffect(() => {
    if (currentPage !== prevPageRef.current) {
      setTimeout(() => {
        if (resultsDivRef.current) {
          resultsDivRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 0);
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  return (
    <div
      id="top"
      ref={resultsDivRef}
      className="mb-4 w-full sm:mb-8"
      style={isStale ? { opacity: 0.7 } : undefined}
    >
      <div className="px-1 pt-2 sm:px-0 sm:pt-4">
        <h2 className="mb-4 flex items-center justify-between text-base font-semibold text-foreground sm:mb-6 sm:text-lg">
          {t('results')}{' '}
          <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">
            {deferredResults.length === 1
              ? `${deferredResults.length} ${t('result')}`
              : `${deferredResults.length} ${t('resultsCount')}`}
          </span>
        </h2>

        {children ?? (
          <>
            <ResultsDisplay.List results={visibleResults} source={source} />
            {shouldShowPreview && deferredResults.length > visiblePreviewCount ? (
              <ResultsDisplay.ShowAll
                count={deferredResults.length}
                onShowAll={() => setShowAll(true)}
              />
            ) : null}
            {!shouldShowPreview && deferredResults.length > 0 ? (
              <ResultsDisplay.Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function ResultsDisplayList({
  results,
  source = 'search',
}: {
  results: University[];
  source?: HubSource;
}) {
  const t = useTranslations('search');

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center sm:gap-4 sm:py-8">
        <Image
          src="/no-results.svg"
          alt="No Results"
          width={120}
          height={120}
          className="h-20 w-20 sm:h-[120px] sm:w-[120px]"
        />
        <p className="text-xs text-muted-foreground sm:text-sm">{t('noResultsMessageAlt')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5 sm:space-y-3" data-testid="results-list">
      {results.map((uni) => (
        <UniversityCard key={uni.id} uni={uni} source={source} />
      ))}
    </ul>
  );
}

export function ResultsDisplayShowAll({
  count,
  onShowAll,
}: {
  count: number;
  onShowAll: () => void;
}) {
  const t = useTranslations('search');
  return (
    <div className="mt-4 flex items-center justify-center p-3 sm:mt-6 sm:p-4">
        <button
        type="button"
          onClick={onShowAll}
          className="h-9 touch-manipulation rounded-md bg-green px-4 text-xs text-white transition-colors hover:bg-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 sm:h-10 sm:text-sm"
        >
        {t('showAll')} ({count})
      </button>
    </div>
  );
}

export function ResultsDisplayPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const tCommon = useTranslations('common');

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="mt-4 flex items-center justify-center p-3 sm:mt-6 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 touch-manipulation rounded-md border border-input bg-card px-3 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
        >
          {tCommon('previous')}
        </button>
        <p className="flex items-center px-2 text-xs tabular-nums text-muted-foreground sm:px-4 sm:text-sm">
          {currentPage} / {totalPages}
        </p>
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 touch-manipulation rounded-md border border-input bg-card px-3 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
        >
          {tCommon('next')}
        </button>
      </div>
    </div>
  );
}

export const ResultsDisplay = Object.assign(ResultsDisplayRoot, {
  List: ResultsDisplayList,
  ShowAll: ResultsDisplayShowAll,
  Pagination: ResultsDisplayPagination,
});

export default ResultsDisplay;
