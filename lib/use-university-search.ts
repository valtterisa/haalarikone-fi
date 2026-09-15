'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { searchUniversitiesAPI } from '@/lib/search-utils';
import type { ColorData } from '@/lib/load-color-data';
import { getUniqueAreas, getUniqueFields, getUniqueUniversities } from '@/lib/get-unique-values';
import {
  filterUniversities,
  matchesUniversityFilters,
  type UniversityFilterCriteria,
} from '@/lib/university-filters';
import type { University } from '@/types/university';
import { trackSearchApply } from '@/lib/analytics-events';
import {
  clearSearchLog,
  flushSearchLog,
  logSearchNow,
  stageSearchLog,
} from '@/lib/log-search-query';
import type { Locale } from '@/lib/slug-translations';

const TEXT_SEARCH_DEBOUNCE_MS = 1000;

export type FilterTabKey = 'color' | 'area' | 'field' | 'school';

export type CriteriaColor =
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

export type Criteria = {
  textSearch: string;
  color: CriteriaColor;
  area: string;
  field: string;
  school: string;
};

export type AdvancedFilters = Omit<Criteria, 'textSearch'>;

const EMPTY_ADVANCED_FILTERS: AdvancedFilters = {
  color: '',
  area: '',
  field: '',
  school: '',
};

const CRITERIA_COLOR_VALUES = [
  '',
  'valkoinen',
  'musta',
  'punainen',
  'sininen',
  'vihreä',
  'keltainen',
  'oranssi',
  'violetti',
  'pinkki',
  'harmaa',
  'ruskea',
  'turkoosi',
] as const satisfies readonly CriteriaColor[];

function isCriteriaColor(value: string): value is CriteriaColor {
  return (CRITERIA_COLOR_VALUES as readonly string[]).includes(value);
}

export function toCriteriaColor(value: string): CriteriaColor {
  return isCriteriaColor(value) ? value : '';
}

function compareOppilaitosThenAinejarjesto(a: University, b: University): number {
  if (a.oppilaitos === b.oppilaitos) {
    if (!a.ainejarjesto && !b.ainejarjesto) return 0;
    if (!a.ainejarjesto) return 1;
    if (!b.ainejarjesto) return -1;
    return a.ainejarjesto.localeCompare(b.ainejarjesto);
  }
  return a.oppilaitos.localeCompare(b.oppilaitos);
}

export type UseUniversitySearchOptions = {
  initialUniversities: University[];
  colorData: ColorData;
  initialTextSearch?: string;
  showResultsByDefault?: boolean;
};

export function useUniversitySearch({
  initialUniversities,
  colorData,
  initialTextSearch = '',
  showResultsByDefault = false,
}: UseUniversitySearchOptions) {
  const locale = useLocale() as Locale;
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria>({
    textSearch: initialTextSearch.trim(),
    ...EMPTY_ADVANCED_FILTERS,
  });

  const [draftAdvancedFilters, setDraftAdvancedFilters] =
    useState<AdvancedFilters>(EMPTY_ADVANCED_FILTERS);

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
    () => initialUniversities.toSorted(compareOppilaitosThenAinejarjesto),
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

  const appliedFilterCriteria = useMemo((): UniversityFilterCriteria => {
    return {
      color: selectedCriteria.color || undefined,
      area: selectedCriteria.area || undefined,
      field: selectedCriteria.field || undefined,
      school: selectedCriteria.school || undefined,
    };
  }, [
    selectedCriteria.color,
    selectedCriteria.area,
    selectedCriteria.field,
    selectedCriteria.school,
  ]);

  const applyFilters = useCallback(
    (universities: University[]): University[] => {
      return filterUniversities(universities, appliedFilterCriteria, colorData);
    },
    [appliedFilterCriteria, colorData],
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
    return filtered.toSorted(compareOppilaitosThenAinejarjesto);
  }, [searchSourceUniversities, applyFilters, selectedCriteria.textSearch]);

  const stagedTextRef = useRef('');
  const wasSearchingRef = useRef(false);
  const criteriaRef = useRef(selectedCriteria);
  criteriaRef.current = selectedCriteria;
  const applyFiltersRef = useRef(applyFilters);
  applyFiltersRef.current = applyFilters;

  useEffect(() => {
    const searchJustFinished = wasSearchingRef.current && !isSearching;
    wasSearchingRef.current = isSearching;

    if (isSearching) return;

    const query = debouncedTextSearch.trim();
    if (query.length < 3) {
      stagedTextRef.current = '';
      clearSearchLog();
      return;
    }

    if (!searchJustFinished) return;
    if (stagedTextRef.current === query) return;
    stagedTextRef.current = query;

    const criteria = criteriaRef.current;
    stageSearchLog({
      query,
      locale,
      resultCount: applyFiltersRef.current(searchSourceUniversities).length,
      source: 'listing',
      color: criteria.color || null,
      area: criteria.area || null,
      field: criteria.field || null,
      school: criteria.school || null,
    });
  }, [isSearching, debouncedTextSearch, searchSourceUniversities, locale]);

  const flushListingSearchLog = useCallback(() => {
    stagedTextRef.current = '';
    flushSearchLog();
  }, []);

  const handleTextSearchChange = useCallback((textSearch: string) => {
    setSelectedCriteria((prev) => ({ ...prev, textSearch }));
  }, []);

  const handleDraftAdvancedFilterChange = useCallback((filters: AdvancedFilters) => {
    setDraftAdvancedFilters(filters);
  }, []);

  const handleClearAll = useCallback(() => {
    stagedTextRef.current = '';
    clearSearchLog();
    setSelectedCriteria({
      textSearch: '',
      ...EMPTY_ADVANCED_FILTERS,
    });
    setDraftAdvancedFilters(EMPTY_ADVANCED_FILTERS);
  }, []);

  const handleRemoveFilter = useCallback(
    (key: FilterTabKey) => {
      let next = selectedCriteria;
      switch (key) {
        case 'color':
          next = { ...selectedCriteria, color: '' };
          break;
        case 'area':
          next = { ...selectedCriteria, area: '' };
          break;
        case 'field':
          next = { ...selectedCriteria, field: '' };
          break;
        case 'school':
          next = { ...selectedCriteria, school: '' };
          break;
      }
      setSelectedCriteria(next);

      const query = next.textSearch.trim();
      logSearchNow({
        query: query.length >= 3 ? query : '',
        locale,
        resultCount: filterUniversities(
          searchSourceUniversities,
          {
            color: next.color || undefined,
            area: next.area || undefined,
            field: next.field || undefined,
            school: next.school || undefined,
          },
          colorData,
        ).length,
        source: 'listing',
        color: next.color || null,
        area: next.area || null,
        field: next.field || null,
        school: next.school || null,
      });
    },
    [selectedCriteria, searchSourceUniversities, colorData, locale],
  );

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
      const filters: UniversityFilterCriteria = {
        color: ignore === 'color' ? undefined : draftAdvancedFilters.color || undefined,
        area: ignore === 'area' ? undefined : draftAdvancedFilters.area || undefined,
        field: ignore === 'field' ? undefined : draftAdvancedFilters.field || undefined,
        school: ignore === 'school' ? undefined : draftAdvancedFilters.school || undefined,
      };
      return matchesUniversityFilters(uni, filters, colorData);
    },
    [draftAdvancedFilters, colorData],
  );

  const draftFilterResultCount = useMemo(
    () => searchSourceUniversities.filter((uni) => matchesDraftFilters(uni)).length,
    [searchSourceUniversities, matchesDraftFilters],
  );

  const handleApplyAdvancedFilters = useCallback(() => {
    setSelectedCriteria((prev) => ({
      ...prev,
      ...draftAdvancedFilters,
    }));

    const query = selectedCriteria.textSearch.trim();
    logSearchNow({
      query: query.length >= 3 ? query : '',
      locale,
      resultCount: draftFilterResultCount,
      source: 'listing',
      color: draftAdvancedFilters.color || null,
      area: draftAdvancedFilters.area || null,
      field: draftAdvancedFilters.field || null,
      school: draftAdvancedFilters.school || null,
    });
  }, [selectedCriteria.textSearch, draftAdvancedFilters, draftFilterResultCount, locale]);

  const { areaOptions, fieldOptions, schoolOptions } = useMemo(() => {
    const forArea: University[] = [];
    const forField: University[] = [];
    const forSchool: University[] = [];

    for (const uni of initialUniversities) {
      if (matchesDraftFilters(uni, 'area')) forArea.push(uni);
      if (matchesDraftFilters(uni, 'field')) forField.push(uni);
      if (matchesDraftFilters(uni, 'school')) forSchool.push(uni);
    }

    return {
      areaOptions: getUniqueAreas(forArea),
      fieldOptions: getUniqueFields(forField),
      schoolOptions: getUniqueUniversities(forSchool),
    };
  }, [initialUniversities, matchesDraftFilters]);

  useEffect(() => {
    return () => {
      stagedTextRef.current = '';
      flushSearchLog();
    };
  }, []);

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

  return useMemo(
    () => ({
      selectedCriteria,
      draftAdvancedFilters,
      results,
      hasSearched,
      isSearching,
      hasActiveQuery,
      draftFilterResultCount,
      areaOptions,
      fieldOptions,
      schoolOptions,
      colorData,
      handleTextSearchChange,
      handleDraftAdvancedFilterChange,
      handleSearchBlur: flushListingSearchLog,
      handleApplyAdvancedFilters,
      handleClearAll,
      handleRemoveFilter,
    }),
    [
      selectedCriteria,
      draftAdvancedFilters,
      results,
      hasSearched,
      isSearching,
      hasActiveQuery,
      draftFilterResultCount,
      areaOptions,
      fieldOptions,
      schoolOptions,
      colorData,
      handleTextSearchChange,
      handleDraftAdvancedFilterChange,
      flushListingSearchLog,
      handleApplyAdvancedFilters,
      handleClearAll,
      handleRemoveFilter,
    ],
  );
}

export type UniversitySearchState = ReturnType<typeof useUniversitySearch>;
