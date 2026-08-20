'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import SearchForm from './search-form';
import ResultsDisplay from './result-display';
import PlaceholderDisplay from './placeholder-display';
import type { ColorData } from '@/lib/load-color-data';
import type { University } from '@/types/university';
import type { HubSource } from '@/lib/analytics-events';
import {
  useUniversitySearch,
  type Criteria,
  type UniversitySearchState,
} from '@/lib/use-university-search';

export type { Criteria };

type SearchContainerContextValue = UniversitySearchState & {
  resultSource: HubSource;
};

const SearchContainerContext = createContext<SearchContainerContextValue | null>(null);

function useSearchContainer() {
  const ctx = useContext(SearchContainerContext);
  if (!ctx) {
    throw new Error('SearchContainer compound parts must be used within SearchContainer');
  }
  return ctx;
}

type SearchContainerRootProps = {
  initialUniversities: University[];
  colorData: ColorData;
  initialTextSearch?: string;
  resultSource?: HubSource;
  showResultsByDefault?: boolean;
  children: ReactNode;
};

export function SearchContainerRoot({
  initialUniversities,
  colorData,
  initialTextSearch = '',
  resultSource = 'search',
  showResultsByDefault = false,
  children,
}: SearchContainerRootProps) {
  const search = useUniversitySearch({
    initialUniversities,
    colorData,
    initialTextSearch,
    showResultsByDefault,
  });

  const value = useMemo(
    () => ({ ...search, resultSource }),
    [search, resultSource],
  );

  return (
    <SearchContainerContext.Provider value={value}>
      <div className="w-full">{children}</div>
    </SearchContainerContext.Provider>
  );
}

export function SearchContainerForm() {
  const {
    handleTextSearchChange,
    handleDraftAdvancedFilterChange,
    handleApplyAdvancedFilters,
    handleClearAll,
    handleRemoveFilter,
    areaOptions,
    fieldOptions,
    schoolOptions,
    selectedCriteria,
    draftAdvancedFilters,
    draftFilterResultCount,
    isSearching,
    colorData,
  } = useSearchContainer();

  return (
    <SearchForm
      onTextSearchChange={handleTextSearchChange}
      onDraftAdvancedFilterChange={handleDraftAdvancedFilterChange}
      onApplyAdvancedFilters={handleApplyAdvancedFilters}
      onClearAll={handleClearAll}
      onRemoveFilter={handleRemoveFilter}
      areas={areaOptions}
      fields={fieldOptions}
      schools={schoolOptions}
      selectedCriteria={selectedCriteria}
      draftAdvancedFilters={draftAdvancedFilters}
      draftFilterResultCount={draftFilterResultCount}
      isSearching={isSearching}
      colorData={colorData}
    />
  );
}

export function SearchContainerBelow({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SearchContainerLoading() {
  return (
    <div className="mb-4 w-full sm:mb-8">
      <div className="space-y-3 px-1 py-2 sm:px-0 sm:py-4">
        <div className="h-4 w-40 rounded-md bg-muted motion-safe:animate-pulse" />
        <div className="h-20 w-full rounded-xl border border-border bg-card motion-safe:animate-pulse" />
        <div className="h-20 w-full rounded-xl border border-border bg-card motion-safe:animate-pulse" />
        <div className="h-20 w-full rounded-xl border border-border bg-card motion-safe:animate-pulse" />
        <div className="h-20 w-full rounded-xl border border-border bg-card motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

export function SearchContainerEmpty() {
  const t = useTranslations('search');
  return (
    <div className="mx-auto max-w-xl rounded-xl bg-muted/50 p-8 text-center">
      <p className="text-lg text-muted-foreground">{t('noResultsMessage')}</p>
    </div>
  );
}

export function SearchContainerResults({
  previewCount,
  whenIdle = 'none',
}: {
  previewCount?: number;
  whenIdle?: 'none' | 'placeholder' | 'results';
}) {
  const { hasActiveQuery, isSearching, results, hasSearched, resultSource } = useSearchContainer();

  if (hasActiveQuery && isSearching) {
    return <SearchContainerLoading />;
  }

  if (hasActiveQuery && !isSearching && results.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ResultsDisplay
          results={results}
          initialVisibleCount={previewCount}
          source={resultSource}
        />
      </motion.div>
    );
  }

  if (hasActiveQuery && hasSearched && !isSearching && results.length === 0) {
    return <SearchContainerEmpty />;
  }

  if (!hasActiveQuery && whenIdle === 'placeholder') {
    return <PlaceholderDisplay />;
  }

  if (!hasActiveQuery && whenIdle === 'results' && results.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ResultsDisplay
          results={results}
          initialVisibleCount={previewCount}
          source={resultSource}
        />
      </motion.div>
    );
  }

  return null;
}

export const SearchContainer = Object.assign(SearchContainerRoot, {
  Form: SearchContainerForm,
  Below: SearchContainerBelow,
  Results: SearchContainerResults,
  Loading: SearchContainerLoading,
  Empty: SearchContainerEmpty,
});

export default SearchContainer;
