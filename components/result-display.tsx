import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { University } from "@/types/university";
import UniversityCard from "@/components/university-card";
import { useTranslations } from 'next-intl';

interface ResultsDisplayProps {
  results: University[];
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(15);
  const resultsDivRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(1);

  // Calculate the total number of pages
  const totalPages = Math.ceil(results.length / resultsPerPage);

  // Slice the results based on the current page and results per page
  const paginatedResults = results.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  // When results change, reset pagination (don't scroll)
  useEffect(() => {
    setCurrentPage(1);
    prevPageRef.current = 1;
  }, [results]);

  // Scroll to top when page changes (but not when results change resets to page 1)
  useEffect(() => {
    // Only scroll if page changed AND it wasn't a reset from results changing
    if (currentPage !== prevPageRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (resultsDivRef.current) {
          resultsDivRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 0);
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div
      id="top"
      ref={resultsDivRef}
      className="max-w-3xl w-full mx-auto mb-4 sm:mb-8 px-2"
    >
      <div className="bg-white rounded-lg border border-border shadow-sm px-3 pt-4 sm:px-6 sm:pt-8">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 flex justify-between items-center">
          {t('results')}{" "}
          <span className="text-xs sm:text-sm text-muted-foreground">
            {results.length === 1
              ? `${results.length} ${t('result')}`
              : `${results.length} ${t('resultsCount')}`}
          </span>
        </h2>

        {results.length === 0 ? (
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center gap-3 sm:gap-4 text-center">
            <Image
              src="/no-results.svg"
              alt="No Results"
              width={120}
              height={120}
              className="w-20 h-20 sm:w-[120px] sm:h-[120px]"
            />
            <p className="text-muted-foreground text-xs sm:text-sm">
              {t('noResultsMessageAlt')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5 sm:space-y-3">
            {paginatedResults.map((uni) => (
              <UniversityCard key={uni.id} uni={uni} />
            ))}
          </ul>
        )}

        {/* Pagination Controls */}
        {results.length > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 border-t border-border flex justify-center items-center">
            <div className="flex gap-2 sm:gap-3 items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm bg-white text-foreground border border-input hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tCommon('previous')}
              </button>
              <p className="flex items-center text-xs sm:text-sm text-muted-foreground px-2 sm:px-4">
                {currentPage} / {totalPages}
              </p>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm bg-white text-foreground border border-input hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tCommon('next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
