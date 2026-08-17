'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  Check,
} from '@phosphor-icons/react';
import { ColorAtmosphere } from './color-atmosphere';
import { Criteria } from './search-container';
import type { ColorData } from '@/lib/load-color-data';
import { track } from '@databuddy/sdk';
import { trackFilterSelect } from '@/lib/analytics-events';
import { useTranslations, useLocale } from 'next-intl';
import translationsData from '../data/translations.json';

interface SearchFormProps {
  onTextSearchChange: (textSearch: string) => void;
  onDraftAdvancedFilterChange: (filters: Omit<Criteria, 'textSearch'>) => void;
  onApplyAdvancedFilters: () => void;
  onClearAll: () => void;
  areas: string[];
  fields: string[];
  schools: string[];
  selectedCriteria: Criteria;
  draftAdvancedFilters: Omit<Criteria, 'textSearch'>;
  resultCount: number;
  draftFilterResultCount: number;
  hasSearched: boolean;
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

// Filter section component with expandable content
function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
  hasSelection,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasSelection: boolean;
}) {
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-muted/30 transition-colors relative z-10"
      >
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          {title}
          {hasSelection && <span className="w-2 h-2 rounded-full bg-green" />}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <div className="pb-3 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Chip selector for options
function ChipSelector({
  options,
  selected,
  onSelect,
  renderOption,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  renderOption?: (option: string, isSelected: boolean) => React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option;
        if (renderOption) {
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(isSelected ? '' : option)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-green/50 rounded-lg"
            >
              {renderOption(option, isSelected)}
            </button>
          );
        }
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(isSelected ? '' : option)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-150 ${
              isSelected
                ? 'bg-green text-white shadow-sm'
                : 'bg-muted text-foreground shadow-sm hover:bg-muted/80'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// Color swatch component
function ColorSwatch({
  color,
  colorKey,
  displayName,
  isSelected,
  onSelect,
}: {
  color: string;
  colorKey: string;
  displayName: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isWhite = colorKey === 'valkoinen' || color === '#FFFFFF';
  const isBlack = colorKey === 'musta' || color === '#000000';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-150 ${
        isSelected ? 'bg-muted/70' : 'hover:bg-muted/40'
      }`}
      title={displayName}
    >
      <div
      className={`w-8 h-8 rounded-xl border-2 transition-all duration-150 flex items-center justify-center ${
          isSelected
            ? 'border-green ring-2 ring-green/30 scale-110'
            : isWhite
              ? 'border-border'
              : 'border-transparent'
        }`}
        style={{ backgroundColor: color }}
      >
        {isSelected && (
          <Check
            className={`w-4 h-4 ${
              isWhite || color === '#FFFF00' || color === '#FFA500'
                ? 'text-foreground'
                : isBlack
                  ? 'text-white'
                  : 'text-white'
            }`}
          />
        )}
      </div>
      <span
        className={`text-[10px] leading-tight text-center max-w-[50px] truncate ${
          isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
        }`}
      >
        {displayName}
      </span>
    </button>
  );
}

export default function SearchForm({
  onTextSearchChange,
  onDraftAdvancedFilterChange,
  onApplyAdvancedFilters,
  onClearAll,
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
  const locale = useLocale() as 'fi' | 'en' | 'sv';
  const reduceMotion = useReducedMotion();

  const translateEntity = (
    value: string,
    type: 'color' | 'area' | 'field' | 'university',
  ): string => {
    if (type === 'color') {
      const baseToFiKey: Record<string, string> = {
        punainen: 'punainen',
        sininen: 'sininen',
        vihreä: 'vihreä',
        keltainen: 'keltainen',
        oranssi: 'oranssi',
        violetti: 'violetti',
        pinkki: 'pinkki',
        harmaa: 'harmaa',
        ruskea: 'ruskea',
        turkoosi: 'turkoosi',
      };

      const lookupKey = baseToFiKey[value] ?? value;
      const translation = translations.colors[lookupKey];
      return translation?.[locale] || value;
    }

    const translationsMap =
      type === 'area'
        ? translations.areas
        : type === 'field'
          ? translations.fields
          : translations.universities;

    const translation = translationsMap[value];
    return translation?.[locale] || value;
  };

  // Translate color options for display
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    color: true,
    area: false,
    field: false,
    school: false,
  });
  const [localSearchValue, setLocalSearchValue] = useState(selectedCriteria.textSearch);
  const lastTrackedSearchRef = useRef<string>('');

  useEffect(() => {
    setLocalSearchValue(selectedCriteria.textSearch);
  }, [selectedCriteria.textSearch]);

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleDraftChange = (field: 'color' | 'area' | 'field' | 'school', value: string) => {
    onDraftAdvancedFilterChange({ ...draftAdvancedFilters, [field]: value });
    trackFilterSelect(field === 'school' ? 'school' : field, value);
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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters =
    selectedCriteria.color ||
    selectedCriteria.area ||
    selectedCriteria.field ||
    selectedCriteria.school;

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

  // Shared filter content for both mobile drawer and desktop
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'space-y-0' : 'space-y-0'}>
      {/* Colors Section */}
      <FilterSection
        title={t('color')}
        isExpanded={expandedSections.color}
        onToggle={() => toggleSection('color')}
        hasSelection={!!draftAdvancedFilters.color}
      >
        <div className="flex flex-wrap gap-1">
          {translatedColorOptions.map(({ key, displayName, color }) => (
            <ColorSwatch
              key={key}
              color={color}
              colorKey={key}
              displayName={displayName}
              isSelected={draftAdvancedFilters.color === key}
              onSelect={() =>
                handleDraftChange('color', draftAdvancedFilters.color === key ? '' : key)
              }
            />
          ))}
        </div>
      </FilterSection>

      {/* City Section */}
      <FilterSection
        title={t('city')}
        isExpanded={expandedSections.area}
        onToggle={() => toggleSection('area')}
        hasSelection={!!draftAdvancedFilters.area}
      >
        <div className="max-h-48 overflow-y-auto scrollbar-none">
          <ChipSelector
            options={areas}
            selected={draftAdvancedFilters.area}
            onSelect={(value) => handleDraftChange('area', value)}
          />
        </div>
      </FilterSection>

      {/* Field Section */}
      <FilterSection
        title={t('field')}
        isExpanded={expandedSections.field}
        onToggle={() => toggleSection('field')}
        hasSelection={!!draftAdvancedFilters.field}
      >
        <div className="max-h-48 overflow-y-auto scrollbar-none">
          <ChipSelector
            options={fields}
            selected={draftAdvancedFilters.field}
            onSelect={(value) => handleDraftChange('field', value)}
          />
        </div>
      </FilterSection>

      {/* School Section */}
      <FilterSection
        title={t('school')}
        isExpanded={expandedSections.school}
        onToggle={() => toggleSection('school')}
        hasSelection={!!draftAdvancedFilters.school}
      >
        <div className="max-h-48 overflow-y-auto scrollbar-none">
          <ChipSelector
            options={schools}
            selected={draftAdvancedFilters.school}
            onSelect={(value) => handleDraftChange('school', value)}
          />
        </div>
      </FilterSection>
    </div>
  );

  // Active filter chips for mobile
  const ActiveFilterChips = () => {
    if (!hasActiveFilters) return null;

    const filters = [
      {
        key: 'color',
        value: selectedCriteria.color,
        display: selectedCriteria.color ? translateEntity(selectedCriteria.color, 'color') : null,
        color: selectedCriteria.color ? colorData.colors[selectedCriteria.color]?.color : null,
      },
      { key: 'area', value: selectedCriteria.area, display: selectedCriteria.area },
      { key: 'field', value: selectedCriteria.field, display: selectedCriteria.field },
      { key: 'school', value: selectedCriteria.school, display: selectedCriteria.school },
    ].filter((f) => f.value);

    return (
      <div className="relative flex flex-wrap items-center gap-2 px-3 pb-3 sm:hidden">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              onDraftAdvancedFilterChange({ ...draftAdvancedFilters, [filter.key]: '' });
              onApplyAdvancedFilters();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-muted/60 text-foreground rounded-md active:bg-muted transition-colors"
          >
            {filter.key === 'color' && filter.color && (
              <span
                className="w-2.5 h-2.5 rounded-full border border-border/50"
                style={{ backgroundColor: filter.color }}
              />
            )}
            <span>{filter.display}</span>
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="px-2.5 py-1.5 text-sm text-muted-foreground active:text-foreground transition-colors"
        >
          {t('clear')}
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-4 w-full sm:mb-8"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
        <div className="relative overflow-hidden px-3 pb-3 pt-4 sm:px-6 sm:pb-5 sm:pt-7">
          <ColorAtmosphere
            hexes={translatedColorOptions.map((option) => option.color)}
          />
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground sm:left-5 sm:h-7 sm:w-7" weight="regular" />
            <Input
              ref={searchInputRef}
              id="text-search"
              type="text"
              value={localSearchValue}
              onChange={(e) => handleTextSearchChange(e.target.value)}
              placeholder={t('placeholder')}
              data-testid="text-search-input"
              className="h-14 border-2 border-input bg-background pl-11 pr-24 text-lg shadow-sm transition-[box-shadow,border-color] hover:border-green/40 focus-visible:border-green focus-visible:ring-2 focus-visible:ring-green/30 sm:h-[4.5rem] sm:pl-16 sm:pr-28 sm:text-xl"
              aria-disabled={isSearching}
            />
            {!localSearchValue && !isSearching && (
              <kbd className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            )}
            {isSearching && (
              <div className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-10">
                <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-green border-t-transparent rounded-full motion-safe:animate-spin" />
              </div>
            )}
            {localSearchValue && !isSearching && (
              <button
                type="button"
                onClick={() => handleTextSearchChange('')}
                className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1 sm:p-2 rounded hover:bg-muted z-10"
                aria-label={t('clearSearch')}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Filter button that opens drawer */}
        <div className="relative border-t border-border/50 bg-card px-3 pb-1 pt-1 sm:hidden">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                id="search-filters-trigger"
                type="button"
                className="flex min-h-11 w-full items-center justify-between py-3 px-0 text-left active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t('filters')}</span>
                  {hasActiveFilters && (
                    <span className="px-2 py-0.5 text-xs bg-green text-white rounded-full font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DrawerTrigger>
            <DrawerContent id="search-filters-content" className="h-[85vh] flex flex-col">
              <DrawerHeader className="text-left border-b border-border flex-shrink-0">
                <DrawerTitle className="flex items-center justify-between">
                  <span>{t('filters')}</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-sm font-normal text-muted-foreground active:text-foreground transition-colors"
                    >
                      {t('clear')}
                    </button>
                  )}
                </DrawerTitle>
              </DrawerHeader>

              {/* Tab navigation */}
              <div className="flex gap-1 overflow-x-auto border-b border-border flex-shrink-0">
                {[
                  { key: 'color', label: t('color'), hasValue: !!draftAdvancedFilters.color },
                  { key: 'area', label: t('city'), hasValue: !!draftAdvancedFilters.area },
                  { key: 'field', label: t('field'), hasValue: !!draftAdvancedFilters.field },
                  { key: 'school', label: t('school'), hasValue: !!draftAdvancedFilters.school },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setExpandedSections({
                        color: false,
                        area: false,
                        field: false,
                        school: false,
                        [tab.key]: true,
                      })
                    }
                    className={`w-fit flex-shrink-0 px-3 py-3 text-sm font-medium relative transition-colors ${
                      expandedSections[tab.key] ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {tab.label}
                      {tab.hasValue && <span className="w-1.5 h-1.5 rounded-full bg-green" />}
                    </span>
                    {expandedSections[tab.key] && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-green rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content area - single scroll */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Colors */}
                {expandedSections.color && (
                  <div className="grid grid-cols-4 gap-3">
                    {translatedColorOptions.map(({ key, displayName, color }) => {
                      const isSelected = draftAdvancedFilters.color === key;
                      const isWhite = key === 'valkoinen' || color === '#FFFFFF';
                      const isBlack = key === 'musta' || color === '#000000';
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleDraftChange('color', isSelected ? '' : key)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green/10 ring-2 ring-green'
                              : 'bg-muted active:bg-muted/80'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              isWhite ? 'border-2 border-border' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {isSelected && (
                              <Check
                                className={`w-5 h-5 ${isWhite || color === '#FFFF00' || color === '#FFA500' ? 'text-foreground' : 'text-white'}`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-xs text-center leading-tight ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                          >
                            {displayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cities */}
                {expandedSections.area && (
                  <div className="flex flex-col gap-2">
                    {areas.map((area) => {
                      const isSelected = draftAdvancedFilters.area === area;
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleDraftChange('area', isSelected ? '' : area)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green text-white font-medium shadow-md'
                              : 'bg-muted text-foreground active:bg-muted/80'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fields */}
                {expandedSections.field && (
                  <div className="flex flex-col gap-2">
                    {fields.map((field) => {
                      const isSelected = draftAdvancedFilters.field === field;
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => handleDraftChange('field', isSelected ? '' : field)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green text-white font-medium shadow-md'
                              : 'bg-muted text-foreground active:bg-muted/80'
                          }`}
                        >
                          {field}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Schools */}
                {expandedSections.school && (
                  <div className="flex flex-col gap-2">
                    {schools.map((school) => {
                      const isSelected = draftAdvancedFilters.school === school;
                      return (
                        <button
                          key={school}
                          type="button"
                          onClick={() => handleDraftChange('school', isSelected ? '' : school)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green text-white font-medium shadow-md'
                              : 'bg-muted text-foreground active:bg-muted/80'
                          }`}
                        >
                          {school}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <DrawerFooter className="border-t border-border pt-4 flex-shrink-0">
                <Button
                  type="button"
                  onClick={handleApplyFilters}
                  className="h-12 text-base bg-green hover:bg-green/90 text-white w-full"
                >
                  {t('filter')} {draftFilterResultCount >= 0 && `(${draftFilterResultCount})`}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="h-12 text-base w-full">
                    {t('close') || 'Sulje'}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Active filter chips for mobile */}
        <ActiveFilterChips />

        {/* Desktop: Tab-based filters */}
        <div className="relative hidden border-t border-border/50 bg-card px-3 pb-3 pt-3 sm:block sm:px-6">
          <button
            id="search-filters-desktop-toggle"
            type="button"
            aria-expanded={isAdvancedSearchOpen}
            aria-controls="search-filters-desktop-content"
            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            className="flex min-h-11 w-full items-center justify-between px-0 py-1.5 text-left transition-opacity hover:opacity-70"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {t('filters')}
                {hasActiveFilters ? ` (${activeFilterCount})` : null}
              </span>
            </div>
            {isAdvancedSearchOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>

          {/* Active filters preview when collapsed */}
          {!isAdvancedSearchOpen && hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              {[
                {
                  key: 'color',
                  value: selectedCriteria.color,
                  display: selectedCriteria.color
                    ? translateEntity(selectedCriteria.color, 'color')
                    : null,
                  color: selectedCriteria.color
                    ? colorData.colors[selectedCriteria.color]?.color
                    : null,
                },
                { key: 'area', value: selectedCriteria.area, display: selectedCriteria.area },
                { key: 'field', value: selectedCriteria.field, display: selectedCriteria.field },
                {
                  key: 'school',
                  value: selectedCriteria.school,
                  display: selectedCriteria.school,
                },
              ]
                .filter((f) => f.value)
                .map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDraftAdvancedFilterChange({ ...draftAdvancedFilters, [filter.key]: '' });
                      onApplyAdvancedFilters();
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-muted/50 text-foreground rounded hover:bg-muted transition-colors"
                  >
                    {filter.key === 'color' && filter.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-border/50"
                        style={{ backgroundColor: filter.color }}
                      />
                    )}
                    <span>{filter.display}</span>
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
              >
                {t('clear')}
              </button>
            </div>
          )}

          {/* Tab-based filter content */}
          {isAdvancedSearchOpen && (
            <div
              id="search-filters-desktop-content"
              className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Tab navigation */}
              <div className="flex gap-1 overflow-x-auto border-b border-border/50">
                {[
                  { key: 'color', label: t('color'), hasValue: !!draftAdvancedFilters.color },
                  { key: 'area', label: t('city'), hasValue: !!draftAdvancedFilters.area },
                  { key: 'field', label: t('field'), hasValue: !!draftAdvancedFilters.field },
                  { key: 'school', label: t('school'), hasValue: !!draftAdvancedFilters.school },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setExpandedSections({
                        color: false,
                        area: false,
                        field: false,
                        school: false,
                        [tab.key]: true,
                      })
                    }
                    className={`w-fit flex-shrink-0 px-4 py-2.5 text-sm font-medium relative transition-colors ${
                      expandedSections[tab.key]
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground/70'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {tab.label}
                      {tab.hasValue && <span className="w-1.5 h-1.5 rounded-full bg-green" />}
                    </span>
                    {expandedSections[tab.key] && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-green rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="pt-4">
                {/* Colors */}
                {expandedSections.color && (
                  <div className="flex flex-wrap gap-1">
                    {translatedColorOptions.map(({ key, displayName, color }) => (
                      <ColorSwatch
                        key={key}
                        color={color}
                        colorKey={key}
                        displayName={displayName}
                        isSelected={draftAdvancedFilters.color === key}
                        onSelect={() =>
                          handleDraftChange('color', draftAdvancedFilters.color === key ? '' : key)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Cities */}
                {expandedSections.area && (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto scrollbar-none">
                    {areas.map((area) => {
                      const isSelected = draftAdvancedFilters.area === area;
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleDraftChange('area', isSelected ? '' : area)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green text-white'
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fields */}
                {expandedSections.field && (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto scrollbar-none">
                    {fields.map((field) => {
                      const isSelected = draftAdvancedFilters.field === field;
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => handleDraftChange('field', isSelected ? '' : field)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green text-white'
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {field}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Schools */}
                {expandedSections.school && (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto scrollbar-none">
                    {schools.map((school) => {
                      const isSelected = draftAdvancedFilters.school === school;
                      return (
                        <button
                          key={school}
                          type="button"
                          onClick={() => handleDraftChange('school', isSelected ? '' : school)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm ${
                            isSelected
                              ? 'bg-green text-white'
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {school}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                {hasDraftChanges && (
                  <Button
                    type="button"
                    onClick={handleApplyFilters}
                    className="h-9 text-sm bg-green hover:bg-green/90 text-white"
                  >
                    {t('filter')} {draftFilterResultCount >= 0 && `(${draftFilterResultCount})`}
                  </Button>
                )}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    {t('clear')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
