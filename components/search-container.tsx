'use client';

import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import SearchForm from './search-form';
import ResultsDisplay from './result-display';
import PlaceholderDisplay from './placeholder-display';
import { searchUniversitiesAPI } from '@/lib/search-utils';
import type { ColorData } from '@/lib/load-color-data';
import { getUniqueAreas, getUniqueFields, getUniqueUniversities } from '@/lib/get-unique-values';
import type { University } from '@/types/university';
import { trackSearchApply } from '@/lib/analytics-events';
import type { HubSource } from '@/lib/analytics-events';

const TEXT_SEARCH_DEBOUNCE_MS = 1000;

function compareOppilaitosThenAinejarjesto(a: University, b: University): number {
  if (a.oppilaitos === b.oppilaitos) {
    if (!a.ainejarjesto && !b.ainejarjesto) return 0;
    if (!a.ainejarjesto) return 1;
    if (!b.ainejarjesto) return -1;
    return a.ainejarjesto.localeCompare(b.ainejarjesto);
  }
  return a.oppilaitos.localeCompare(b.oppilaitos);
}

export type Criteria = {
  textSearch: string;
  color:
    | ''
    | 'valkoinen'
    | 'musta'
    | 'punainen'
    | 'sininen'
    | 'vihreä'
    | 'keltainen'
    | 'oranssi'
    | 'violetti'
    | 'pinkki'
    | 'harmaa'
    | 'ruskea'
    | 'turkoosi';
  area: string;
  field: string;
  school: string;
};

interface SearchContainerProps {
  initialUniversities: University[];
  colorData: ColorData;
  initialInlineResultsCount?: number;
  showResultsByDefault?: boolean;
  showIdlePlaceholder?: boolean;
  initialTextSearch?: string;
  belowForm?: ReactNode;
  resultSource?: HubSource;
}

export default function SearchContainer({
  initialUniversities,
  colorData,
  initialInlineResultsCount,
  showResultsByDefault = false,
  showIdlePlaceholder = false,
  initialTextSearch = '',
  belowForm,
  resultSource = 'search',
}: SearchContainerProps) {
  const locale = useLocale() as 'fi' | 'en' | 'sv';
  const t = useTranslations('search');
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria>({
    textSearch: initialTextSearch.trim(),
    color: '',
    area: '',
    field: '',
    school: '',
  });

  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<Omit<Criteria, 'textSearch'>>({
    color: '',
    area: '',
    field: '',
    school: '',
  });

  const [searchSourceUniversities, setSearchSourceUniversities] = useState<University[]>(
    () => initialUniversities,
  );
  const [hasSearched, setHasSearched] = useState(false);
  const hasSearchedRef = useRef(hasSearched);
  hasSearchedRef.current = hasSearched;
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const hasActiveQuery =
    selectedCriteria.textSearch.trim().length >= 3 ||
    Boolean(
      selectedCriteria.color ||
        selectedCriteria.area ||
        selectedCriteria.field ||
        selectedCriteria.school,
    );
  const sortedInitialUniversities = useMemo(
    () => [...initialUniversities].sort(compareOppilaitosThenAinejarjesto),
    [initialUniversities],
  );

  const [debouncedTextSearch, setDebouncedTextSearch] = useState('');

  useEffect(() => {
    const raw = selectedCriteria.textSearch;
    const trimmed = raw.trim();
    if (trimmed.length < 3) {
      setDebouncedTextSearch(raw);
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      setDebouncedTextSearch(raw);
    }, TEXT_SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timeoutId);
      searchRequestIdRef.current += 1;
    };
  }, [selectedCriteria.textSearch]);

  const applyFilters = useCallback(
    (universities: University[]): University[] => {
      return universities.filter((uni) => {
        const colorMatch = selectedCriteria.color
          ? (uni.variBase?.length ? uni.variBase.includes(selectedCriteria.color) : true) &&
            [
              ...colorData.colors[selectedCriteria.color].main,
              ...colorData.colors[selectedCriteria.color].shades,
            ].some((c) => uni.vari.toLowerCase().includes(c.toLowerCase()))
          : true;
        const areaMatch =
          !selectedCriteria.area ||
          uni.alue.toLowerCase().includes(selectedCriteria.area.toLowerCase());
        const fieldMatch =
          !selectedCriteria.field ||
          uni.ala?.toLowerCase().includes(selectedCriteria.field.toLowerCase());
        const schoolMatch =
          !selectedCriteria.school ||
          uni.oppilaitos.toLowerCase().includes(selectedCriteria.school.toLowerCase());
        return colorMatch && areaMatch && fieldMatch && schoolMatch;
      });
    },
    [
      selectedCriteria.color,
      selectedCriteria.area,
      selectedCriteria.field,
      selectedCriteria.school,
      colorData.colors,
    ],
  );

  const performSearch = useCallback(async () => {
    const currentRequestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = currentRequestId;
    setIsSearching(true);
    try {
      let searchResults: University[] = [];

      if (debouncedTextSearch.trim().length >= 3) {
        try {
          searchResults = await searchUniversitiesAPI(
            debouncedTextSearch.trim(),
            locale,
            {
              universities: initialUniversities,
              colorData,
            },
            {
              waitForSemanticEnrichment: true,
            },
          );
        } catch (error) {
          console.error('Search failed', error);
          searchResults = [];
        }
      } else {
        searchResults = initialUniversities;
      }

      if (searchRequestIdRef.current !== currentRequestId) {
        return;
      }
      setSearchSourceUniversities(searchResults);
      setHasSearched(true);
    } finally {
      if (searchRequestIdRef.current === currentRequestId) {
        setIsSearching(false);
      }
    }
  }, [debouncedTextSearch, initialUniversities, locale, colorData]);

  const performSearchRef = useRef(performSearch);
  performSearchRef.current = performSearch;

  useEffect(() => {
    const hasTextSearchLive = selectedCriteria.textSearch.trim().length >= 3;
    const hasFilters =
      selectedCriteria.color ||
      selectedCriteria.area ||
      selectedCriteria.field ||
      selectedCriteria.school;
    const hasTextSearchDebounced = debouncedTextSearch.trim().length >= 3;

    if (hasSearchedRef.current && !hasTextSearchLive && !hasFilters) {
      if (showResultsByDefault) {
        setSearchSourceUniversities(sortedInitialUniversities);
      } else {
        setSearchSourceUniversities([]);
        setHasSearched(false);
      }
      setIsSearching(false);
      return undefined;
    }

    if (hasTextSearchDebounced || hasFilters) {
      void performSearchRef.current();
      return undefined;
    }

    return undefined;
  }, [
    debouncedTextSearch,
    selectedCriteria.textSearch,
    selectedCriteria.color,
    selectedCriteria.area,
    selectedCriteria.field,
    selectedCriteria.school,
    showResultsByDefault,
    sortedInitialUniversities,
  ]);

  useEffect(() => {
    if (showResultsByDefault && !hasActiveQuery) {
      setSearchSourceUniversities(sortedInitialUniversities);
      setHasSearched(true);
    }
  }, [showResultsByDefault, hasActiveQuery, sortedInitialUniversities]);

  const results = useMemo(() => {
    const filtered = applyFilters(searchSourceUniversities);
    if (selectedCriteria.textSearch.trim().length >= 3) {
      return filtered;
    }
    return [...filtered].sort(compareOppilaitosThenAinejarjesto);
  }, [searchSourceUniversities, applyFilters, selectedCriteria.textSearch]);

  const handleTextSearchChange = useCallback((textSearch: string) => {
    setSelectedCriteria((prev) => ({ ...prev, textSearch }));
  }, []);

  const handleDraftAdvancedFilterChange = useCallback((filters: Omit<Criteria, 'textSearch'>) => {
    setDraftAdvancedFilters(filters);
  }, []);

  const handleApplyAdvancedFilters = useCallback(() => {
    setSelectedCriteria((prev) => ({
      ...prev,
      color: draftAdvancedFilters.color,
      area: draftAdvancedFilters.area,
      field: draftAdvancedFilters.field,
      school: draftAdvancedFilters.school,
    }));
  }, [draftAdvancedFilters]);

  const handleClearAll = useCallback(() => {
    setSelectedCriteria({
      textSearch: '',
      color: '',
      area: '',
      field: '',
      school: '',
    });
    setDraftAdvancedFilters({
      color: '',
      area: '',
      field: '',
      school: '',
    });
  }, []);

  useEffect(() => {
    setDraftAdvancedFilters({
      color: selectedCriteria.color,
      area: selectedCriteria.area,
      field: selectedCriteria.field,
      school: selectedCriteria.school,
    });
  }, [
    selectedCriteria.color,
    selectedCriteria.area,
    selectedCriteria.field,
    selectedCriteria.school,
  ]);

  const matchesDraftFilters = useCallback(
    (uni: University, ignore?: 'color' | 'area' | 'field' | 'school') => {
      const colorMatch =
        ignore === 'color' || !draftAdvancedFilters.color
          ? true
          : (uni.variBase?.length ? uni.variBase.includes(draftAdvancedFilters.color) : true) &&
            [
              ...colorData.colors[draftAdvancedFilters.color].main,
              ...colorData.colors[draftAdvancedFilters.color].shades,
            ].some((c) => uni.vari.toLowerCase().includes(c.toLowerCase()));

      const areaMatch =
        ignore === 'area' ||
        !draftAdvancedFilters.area ||
        uni.alue.toLowerCase().includes(draftAdvancedFilters.area.toLowerCase());

      const fieldMatch =
        ignore === 'field' ||
        !draftAdvancedFilters.field ||
        uni.ala?.toLowerCase().includes(draftAdvancedFilters.field.toLowerCase());

      const schoolMatch =
        ignore === 'school' ||
        !draftAdvancedFilters.school ||
        uni.oppilaitos.toLowerCase().includes(draftAdvancedFilters.school.toLowerCase());

      return colorMatch && areaMatch && fieldMatch && schoolMatch;
    },
    [draftAdvancedFilters, colorData.colors],
  );

  const draftFilterResultCount = useMemo(
    () => searchSourceUniversities.filter((uni) => matchesDraftFilters(uni)).length,
    [searchSourceUniversities, matchesDraftFilters],
  );

  const areaOptions = useMemo(
    () => getUniqueAreas(initialUniversities.filter((uni) => matchesDraftFilters(uni, 'area'))),
    [initialUniversities, matchesDraftFilters],
  );
  const fieldOptions = useMemo(
    () => getUniqueFields(initialUniversities.filter((uni) => matchesDraftFilters(uni, 'field'))),
    [initialUniversities, matchesDraftFilters],
  );
  const schoolOptions = useMemo(
    () =>
      getUniqueUniversities(
        initialUniversities.filter((uni) => matchesDraftFilters(uni, 'school')),
      ),
    [initialUniversities, matchesDraftFilters],
  );

  const lastSearchApplyKey = useRef('');
  useEffect(() => {
    if (!hasActiveQuery || isSearching) {
      return;
    }
    const key = `${selectedCriteria.textSearch}|${selectedCriteria.color}|${selectedCriteria.area}|${selectedCriteria.field}|${selectedCriteria.school}|${results.length}`;
    if (lastSearchApplyKey.current === key) {
      return;
    }
    lastSearchApplyKey.current = key;
    trackSearchApply({
      has_query: selectedCriteria.textSearch.trim().length >= 3,
      has_filters: Boolean(
        selectedCriteria.color ||
          selectedCriteria.area ||
          selectedCriteria.field ||
          selectedCriteria.school,
      ),
      result_count: results.length,
    });
  }, [
    hasActiveQuery,
    isSearching,
    results.length,
    selectedCriteria.textSearch,
    selectedCriteria.color,
    selectedCriteria.area,
    selectedCriteria.field,
    selectedCriteria.school,
  ]);

  return (
    <div className="w-full">
      <SearchForm
        onTextSearchChange={handleTextSearchChange}
        onDraftAdvancedFilterChange={handleDraftAdvancedFilterChange}
        onApplyAdvancedFilters={handleApplyAdvancedFilters}
        onClearAll={handleClearAll}
        areas={areaOptions}
        fields={fieldOptions}
        schools={schoolOptions}
        selectedCriteria={selectedCriteria}
        draftAdvancedFilters={draftAdvancedFilters}
        resultCount={results.length}
        draftFilterResultCount={draftFilterResultCount}
        hasSearched={hasSearched}
        isSearching={isSearching}
        colorData={colorData}
      />
      {belowForm}
      {hasActiveQuery && isSearching && (
        <div className="mb-4 w-full sm:mb-8">
          <div className="space-y-3 px-1 py-2 sm:px-0 sm:py-4">
            <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-20 w-full animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-20 w-full animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-20 w-full animate-pulse rounded-xl border border-border bg-card" />
          </div>
        </div>
      )}
      {hasActiveQuery && !isSearching && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResultsDisplay
            results={results}
            initialVisibleCount={initialInlineResultsCount}
            source={resultSource}
          />
        </motion.div>
      )}
      {hasActiveQuery && hasSearched && !isSearching && results.length === 0 && (
        <div className="mx-auto max-w-xl rounded-xl bg-muted/50 p-8 text-center">
          <p className="text-lg text-muted-foreground">{t('noResultsMessage')}</p>
        </div>
      )}
      {!hasActiveQuery && !showResultsByDefault && showIdlePlaceholder && <PlaceholderDisplay />}
      {!hasActiveQuery && showResultsByDefault && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResultsDisplay
            results={results}
            initialVisibleCount={initialInlineResultsCount}
            source={resultSource}
          />
        </motion.div>
      )}
    </div>
  );
}
