'use client';

import { useState, useRef, useEffect, useMemo, type Ref } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import {
  MagnifyingGlass as SearchIcon,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  X,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { ColorAtmosphere } from './color-atmosphere';
import {
  toCriteriaColor,
  type AdvancedFilters,
  type Criteria,
  type FilterTabKey,
} from '@/lib/use-university-search';
import type { ColorData } from '@/lib/load-color-data';
import { track } from '@databuddy/sdk';
import { trackFilterSelect } from '@/lib/analytics-events';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/lib/slug-translations';
import translationsData from '../data/translations.json';
import {
  ActiveFilterChips,
  ColorGridOption,
  ColorSwatch,
  FilterTabs,
  OptionList,
  type ActiveFilterItem,
} from './search-filter-parts';

interface SearchFormProps {
  onTextSearchChange: (textSearch: string) => void;
  onDraftAdvancedFilterChange: (filters: AdvancedFilters) => void;
  onApplyAdvancedFilters: () => void;
  onClearAll: () => void;
  onRemoveFilter: (key: FilterTabKey) => void;
  areas: string[];
  fields: string[];
  schools: string[];
  selectedCriteria: Criteria;
  draftAdvancedFilters: AdvancedFilters;
  draftFilterResultCount: number;
  isSearching?: boolean;
  colorData: ColorData;
}

type Translations = {
  fields: Record<string, { fi: string; en: string; sv: string }>;
  colors: Record<string, { fi: string; en: string; sv: string }>;
  universities: Record<string, { fi: string; en: string; sv: string }>;
  areas: Record<string, { fi: string; en: string; sv: string }>;
};

const translations = translationsData as Translations;

type ColorOption = { key: string; displayName: string; color: string };

function SearchFilterPanel({
  variant,
  tabs,
  activeTab,
  onTabChange,
  colorOptions,
  draftAdvancedFilters,
  areas,
  fields,
  schools,
  onDraftChange,
}: {
  variant: 'mobile' | 'desktop';
  tabs: { key: FilterTabKey; label: string; hasValue: boolean }[];
  activeTab: FilterTabKey;
  onTabChange: (key: FilterTabKey) => void;
  colorOptions: ColorOption[];
  draftAdvancedFilters: AdvancedFilters;
  areas: string[];
  fields: string[];
  schools: string[];
  onDraftChange: (field: FilterTabKey, value: string) => void;
}) {
  return (
    <>
      <FilterTabs
        tabs={tabs}
        active={activeTab}
        onChange={onTabChange}
        className={variant === 'mobile' ? 'flex-shrink-0 border-border' : undefined}
        tabClassName={variant === 'mobile' ? 'px-3 py-3' : undefined}
      />
      <div className={variant === 'mobile' ? 'flex-1 overflow-y-auto p-4' : 'pt-4'}>
        {activeTab === 'color' ? (
          variant === 'mobile' ? (
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map(({ key, displayName, color }) => (
                <ColorGridOption
                  key={key}
                  color={color}
                  colorKey={key}
                  displayName={displayName}
                  isSelected={draftAdvancedFilters.color === key}
                  onSelect={() =>
                    onDraftChange('color', draftAdvancedFilters.color === key ? '' : key)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {colorOptions.map(({ key, displayName, color }) => (
                <ColorSwatch
                  key={key}
                  color={color}
                  colorKey={key}
                  displayName={displayName}
                  isSelected={draftAdvancedFilters.color === key}
                  onSelect={() =>
                    onDraftChange('color', draftAdvancedFilters.color === key ? '' : key)
                  }
                />
              ))}
            </div>
          )
        ) : null}
        {activeTab === 'area' ? (
          <OptionList
            options={areas}
            selected={draftAdvancedFilters.area}
            onSelect={(value) => onDraftChange('area', value)}
            variant={variant === 'mobile' ? 'row' : 'chip'}
          />
        ) : null}
        {activeTab === 'field' ? (
          <OptionList
            options={fields}
            selected={draftAdvancedFilters.field}
            onSelect={(value) => onDraftChange('field', value)}
            variant={variant === 'mobile' ? 'row' : 'chip'}
          />
        ) : null}
        {activeTab === 'school' ? (
          <OptionList
            options={schools}
            selected={draftAdvancedFilters.school}
            onSelect={(value) => onDraftChange('school', value)}
            variant={variant === 'mobile' ? 'row' : 'chip'}
          />
        ) : null}
      </div>
    </>
  );
}

export function SearchFormRoot({
  onTextSearchChange,
  onDraftAdvancedFilterChange,
  onApplyAdvancedFilters,
  onClearAll,
  onRemoveFilter,
  areas,
  fields,
  schools,
  selectedCriteria,
  draftAdvancedFilters,
  draftFilterResultCount,
  isSearching = false,
  colorData,
}: SearchFormProps) {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const reduceMotion = useReducedMotion();

  const translateEntity = (
    value: string,
    type: 'color' | 'area' | 'field' | 'university',
  ): string => {
    if (type === 'color') {
      return translations.colors[value]?.[locale] ?? value;
    }

    const translationsMap =
      type === 'area'
        ? translations.areas
        : type === 'field'
          ? translations.fields
          : translations.universities;

    return translationsMap[value]?.[locale] ?? value;
  };

  const translatedColorOptions = useMemo(() => {
    return Object.entries(colorData.colors).map(([colorKey, data]) => {
      let displayColor = data.color;

      if (colorKey === 'valkoinen') {
        displayColor = '#FFFFFF';
      } else if (colorKey === 'musta') {
        displayColor = '#000000';
      }

      return {
        key: colorKey,
        displayName: translateEntity(colorKey, 'color'),
        color: displayColor,
      };
    });
  }, [locale, colorData.colors]);

  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTabKey>('color');
  const [localSearchValue, setLocalSearchValue] = useState(selectedCriteria.textSearch);
  const lastTrackedSearchRef = useRef<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearchValue(selectedCriteria.textSearch);
  }, [selectedCriteria.textSearch]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', down, true);
    return () => document.removeEventListener('keydown', down, true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const wasEmpty = !lastTrackedSearchRef.current;
      const isEmpty = !localSearchValue.trim();

      if (wasEmpty && !isEmpty) {
        track('search_change', {
          button_text: 'Text search change',
          location: 'search_form',
        });
        lastTrackedSearchRef.current = localSearchValue;
      } else if (isEmpty) {
        lastTrackedSearchRef.current = '';
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchValue]);

  const handleTextSearchChange = (value: string) => {
    setLocalSearchValue(value);
    onTextSearchChange(value);
  };

  const handleDraftChange = (field: FilterTabKey, value: string) => {
    if (field === 'color') {
      onDraftAdvancedFilterChange({
        ...draftAdvancedFilters,
        color: toCriteriaColor(value),
      });
    } else if (field === 'area') {
      onDraftAdvancedFilterChange({ ...draftAdvancedFilters, area: value });
    } else if (field === 'field') {
      onDraftAdvancedFilterChange({ ...draftAdvancedFilters, field: value });
    } else {
      onDraftAdvancedFilterChange({ ...draftAdvancedFilters, school: value });
    }
    trackFilterSelect(field, value);
  };

  const handleApplyFilters = () => {
    track('advanced_filters', {
      button_text: 'Advanced filters apply',
      location: 'search_form',
    });
    onApplyAdvancedFilters();
    setIsDrawerOpen(false);
  };

  const handleClear = () => {
    onClearAll();
    setIsAdvancedSearchOpen(false);
    setIsDrawerOpen(false);
  };

  const hasActiveFilters = Boolean(
    selectedCriteria.color ||
      selectedCriteria.area ||
      selectedCriteria.field ||
      selectedCriteria.school,
  );

  const hasDraftChanges =
    draftAdvancedFilters.color !== selectedCriteria.color ||
    draftAdvancedFilters.area !== selectedCriteria.area ||
    draftAdvancedFilters.field !== selectedCriteria.field ||
    draftAdvancedFilters.school !== selectedCriteria.school;

  const activeFilterCount = [
    selectedCriteria.color,
    selectedCriteria.area,
    selectedCriteria.field,
    selectedCriteria.school,
  ].filter(Boolean).length;

  const filterTabs = [
    { key: 'color' as const, label: t('color'), hasValue: !!draftAdvancedFilters.color },
    { key: 'area' as const, label: t('city'), hasValue: !!draftAdvancedFilters.area },
    { key: 'field' as const, label: t('field'), hasValue: !!draftAdvancedFilters.field },
    { key: 'school' as const, label: t('school'), hasValue: !!draftAdvancedFilters.school },
  ];

  const activeFilters: ActiveFilterItem[] = [];
  if (selectedCriteria.color) {
    activeFilters.push({
      key: 'color',
      value: selectedCriteria.color,
      display: translateEntity(selectedCriteria.color, 'color'),
      color: colorData.colors[selectedCriteria.color]?.color ?? null,
    });
  }
  if (selectedCriteria.area) {
    activeFilters.push({
      key: 'area',
      value: selectedCriteria.area,
      display: selectedCriteria.area,
    });
  }
  if (selectedCriteria.field) {
    activeFilters.push({
      key: 'field',
      value: selectedCriteria.field,
      display: selectedCriteria.field,
    });
  }
  if (selectedCriteria.school) {
    activeFilters.push({
      key: 'school',
      value: selectedCriteria.school,
      display: selectedCriteria.school,
    });
  }

  const atmosphereHexes = useMemo(
    () => translatedColorOptions.map((option) => option.color),
    [translatedColorOptions],
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-4 w-full sm:mb-8"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
        <SearchForm.TextField
          inputRef={searchInputRef}
          value={localSearchValue}
          onChange={handleTextSearchChange}
          placeholder={t('placeholder')}
          clearLabel={t('clearSearch')}
          isSearching={isSearching}
          atmosphereHexes={atmosphereHexes}
        />

        <div className="relative border-t border-border/50 bg-card px-3 pb-1 pt-1 sm:hidden">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                id="search-filters-trigger"
                type="button"
                className="flex min-h-11 w-full touch-manipulation items-center justify-between px-0 py-3 text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 active:opacity-70"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{t('filters')}</span>
                  {hasActiveFilters ? (
                    <span className="rounded-full bg-green px-2 py-0.5 text-xs font-medium text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </DrawerTrigger>
            <DrawerContent id="search-filters-content" className="flex h-[85vh] flex-col">
              <DrawerHeader className="flex-shrink-0 border-b border-border text-left">
                <DrawerTitle className="flex items-center justify-between">
                  <span>{t('filters')}</span>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-sm font-normal text-muted-foreground transition-colors active:text-foreground"
                    >
                      {t('clear')}
                    </button>
                  ) : null}
                </DrawerTitle>
              </DrawerHeader>
              <SearchFilterPanel
                variant="mobile"
                tabs={filterTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                colorOptions={translatedColorOptions}
                draftAdvancedFilters={draftAdvancedFilters}
                areas={areas}
                fields={fields}
                schools={schools}
                onDraftChange={handleDraftChange}
              />
              <DrawerFooter className="flex-shrink-0 border-t border-border pt-4">
                <Button
                  type="button"
                  onClick={handleApplyFilters}
                  className="h-12 w-full bg-green text-base text-white hover:bg-green/90"
                >
                  {t('filter')} ({draftFilterResultCount})
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="h-12 w-full text-base">
                    {t('close') || 'Sulje'}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <ActiveFilterChips
          filters={activeFilters}
          onRemove={onRemoveFilter}
          onClear={handleClear}
          clearLabel={t('clear')}
          variant="mobile"
        />

        <div className="relative hidden border-t border-border/50 bg-card px-3 pb-3 pt-3 sm:block sm:px-6">
          <button
            id="search-filters-desktop-toggle"
            type="button"
            aria-expanded={isAdvancedSearchOpen}
            aria-controls="search-filters-desktop-content"
            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            className="flex min-h-11 w-full touch-manipulation items-center justify-between px-0 py-1.5 text-left transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">
                {t('filters')}
                {hasActiveFilters ? ` (${activeFilterCount})` : null}
              </span>
            </div>
            {isAdvancedSearchOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
          </button>

          {!isAdvancedSearchOpen ? (
            <ActiveFilterChips
              filters={activeFilters}
              onRemove={onRemoveFilter}
              onClear={handleClear}
              clearLabel={t('clear')}
              variant="desktop"
            />
          ) : null}

          {isAdvancedSearchOpen ? (
            <div
              id="search-filters-desktop-content"
              className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <SearchFilterPanel
                variant="desktop"
                tabs={filterTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                colorOptions={translatedColorOptions}
                draftAdvancedFilters={draftAdvancedFilters}
                areas={areas}
                fields={fields}
                schools={schools}
                onDraftChange={handleDraftChange}
              />
              <div className="mt-4 flex items-center gap-3 border-t border-border/30 pt-4">
                {hasDraftChanges ? (
                  <Button
                    type="button"
                    onClick={handleApplyFilters}
                    className="h-9 bg-green text-sm text-white hover:bg-green/90"
                  >
                    {t('filter')} ({draftFilterResultCount})
                  </Button>
                ) : null}
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                  >
                    {t('clear')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

export function SearchFormTextField({
  inputRef,
  value,
  onChange,
  placeholder,
  clearLabel,
  isSearching,
  atmosphereHexes,
}: {
  inputRef: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  isSearching: boolean;
  atmosphereHexes: string[];
}) {
  return (
    <div className="relative overflow-hidden px-3 pb-3 pt-4 sm:px-6 sm:pb-5 sm:pt-7">
      <ColorAtmosphere hexes={atmosphereHexes} />
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground sm:left-5 sm:h-7 sm:w-7"
          weight="regular"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id="text-search"
          name="q"
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          data-testid="text-search-input"
          className="h-14 border-2 border-input bg-background pl-11 pr-24 text-lg shadow-sm transition-[box-shadow,border-color] touch-manipulation hover:border-green/40 focus-visible:border-green focus-visible:ring-2 focus-visible:ring-green/30 sm:h-[4.5rem] sm:pl-16 sm:pr-28 sm:text-xl"
        />
        {!value && !isSearching ? (
          <kbd className="pointer-events-none absolute right-3 top-1/2 z-10 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:right-6 sm:inline-flex">
            <span className="text-xs">&#8984;&nbsp;K</span>
          </kbd>
        ) : null}
        {isSearching ? (
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-6" aria-hidden="true">
            <div className="h-4 w-4 rounded-full border-2 border-green border-t-transparent motion-safe:animate-spin sm:h-6 sm:w-6" />
          </div>
        ) : null}
        {value && !isSearching ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 touch-manipulation rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 sm:right-6 sm:p-2"
            aria-label={clearLabel}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export const SearchForm = Object.assign(SearchFormRoot, {
  TextField: SearchFormTextField,
});

export default SearchForm;
