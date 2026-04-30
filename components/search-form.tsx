'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Search as SearchIcon, ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { Criteria } from './search-container';
import type { ColorData } from '@/lib/load-color-data';
import { track } from '@databuddy/sdk';
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

  const translateEntity = (
    value: string,
    type: 'color' | 'area' | 'field' | 'university',
  ): string => {
    if (type === 'color') {
      const baseToFiKey: Record<string, string> = {
        white: 'valkoinen',
        black: 'musta',
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

  // Translate color options for display (colors need translation since colorData uses Finnish keys)
  const translatedColorOptions = useMemo(() => {
    return Object.entries(colorData.colors).map(([colorKey, data]) => {
      let displayColor = data.color;

      if (colorKey === 'white') {
        displayColor = '#FFFFFF';
      } else if (colorKey === 'black') {
        displayColor = '#000000';
      }

      return {
        key: colorKey,
        displayName: translateEntity(colorKey, 'color'),
        color: displayColor,
      };
    });
  }, [locale, colorData.colors, translateEntity]);

  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(selectedCriteria.textSearch);
  const lastTrackedSearchRef = useRef<string>('');

  useEffect(() => {
    setLocalSearchValue(selectedCriteria.textSearch);
  }, [selectedCriteria.textSearch]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };
    document.addEventListener('keydown', down, true);
    return () => document.removeEventListener('keydown', down, true);
  }, []);

  useEffect(() => {
    if (commandOpen && searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [commandOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setCommandOpen(false);
      }
    };

    if (commandOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [commandOpen]);

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

  // Filter content shared between mobile drawer and desktop collapsible
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'space-y-5' : 'space-y-2 sm:space-y-3'}>
      <div className={isMobile ? 'space-y-2' : 'space-y-1 sm:space-y-1.5'}>
        <Label
          htmlFor={isMobile ? 'color-mobile' : 'color'}
          className={
            isMobile
              ? 'text-sm text-foreground font-medium'
              : 'text-[10px] sm:text-xs text-muted-foreground font-medium'
          }
        >
          {t('color')}
        </Label>
        <Select
          key={selectedCriteria.color || 'color-empty'}
          value={draftAdvancedFilters.color || undefined}
          onValueChange={(value) => handleDraftChange('color', value)}
        >
          <SelectTrigger
            id={isMobile ? 'color-mobile' : 'color'}
            className={
              isMobile
                ? 'h-12 text-base bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
                : 'h-7 sm:h-8 text-xs sm:text-sm bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
            }
          >
            <SelectValue placeholder={t('selectColor')} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {translatedColorOptions.map(({ key, displayName, color }) => (
              <SelectItem
                key={key}
                value={key}
                className={
                  isMobile
                    ? 'text-base text-foreground py-3'
                    : 'text-xs sm:text-sm text-foreground focus:bg-transparent focus:text-foreground'
                }
              >
                <div className="flex items-center gap-2">
                  <div
                    className={
                      isMobile
                        ? 'w-4 h-4 rounded border'
                        : 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border'
                    }
                    style={{
                      backgroundColor: color,
                    }}
                  />
                  <span>{displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={isMobile ? 'space-y-2' : 'space-y-1 sm:space-y-1.5'}>
        <Label
          htmlFor={isMobile ? 'area-mobile' : 'area'}
          className={
            isMobile
              ? 'text-sm text-foreground font-medium'
              : 'text-[10px] sm:text-xs text-muted-foreground font-medium'
          }
        >
          {t('city')}
        </Label>
        <Select
          key={selectedCriteria.area || 'area-empty'}
          value={draftAdvancedFilters.area || undefined}
          onValueChange={(value) => handleDraftChange('area', value)}
        >
          <SelectTrigger
            id={isMobile ? 'area-mobile' : 'area'}
            className={
              isMobile
                ? 'h-12 text-base bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
                : 'h-7 sm:h-8 text-xs sm:text-sm bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
            }
          >
            <SelectValue placeholder={t('selectCity')} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {areas.map((area) => (
              <SelectItem
                key={area}
                value={area}
                className={
                  isMobile ? 'text-base text-foreground py-3' : 'text-xs sm:text-sm text-foreground'
                }
              >
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={isMobile ? 'space-y-2' : 'space-y-1 sm:space-y-1.5'}>
        <Label
          htmlFor={isMobile ? 'field-mobile' : 'field'}
          className={
            isMobile
              ? 'text-sm text-foreground font-medium'
              : 'text-[10px] sm:text-xs text-muted-foreground font-medium'
          }
        >
          {t('field')}
        </Label>
        <Select
          key={selectedCriteria.field || 'field-empty'}
          value={draftAdvancedFilters.field || undefined}
          onValueChange={(value) => handleDraftChange('field', value)}
        >
          <SelectTrigger
            id={isMobile ? 'field-mobile' : 'field'}
            className={
              isMobile
                ? 'h-12 text-base bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
                : 'h-7 sm:h-8 text-xs sm:text-sm bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
            }
          >
            <SelectValue placeholder={t('selectField')} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {fields.map((field) => (
              <SelectItem
                key={field}
                value={field}
                className={
                  isMobile ? 'text-base text-foreground py-3' : 'text-xs sm:text-sm text-foreground'
                }
              >
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={isMobile ? 'space-y-2' : 'space-y-1 sm:space-y-1.5'}>
        <Label
          htmlFor={isMobile ? 'school-mobile' : 'school'}
          className={
            isMobile
              ? 'text-sm text-foreground font-medium'
              : 'text-[10px] sm:text-xs text-muted-foreground font-medium'
          }
        >
          {t('school')}
        </Label>
        <Select
          key={selectedCriteria.school || 'school-empty'}
          value={draftAdvancedFilters.school || undefined}
          onValueChange={(value) => handleDraftChange('school', value)}
        >
          <SelectTrigger
            id={isMobile ? 'school-mobile' : 'school'}
            className={
              isMobile
                ? 'h-12 text-base bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
                : 'h-7 sm:h-8 text-xs sm:text-sm bg-white text-foreground border-input focus:ring-0 focus-visible:ring-0'
            }
          >
            <SelectValue placeholder={t('selectSchool')} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {schools.map((school) => (
              <SelectItem
                key={school}
                value={school}
                className={
                  isMobile ? 'text-base text-foreground py-3' : 'text-xs sm:text-sm text-foreground'
                }
              >
                {school}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
      },
      { key: 'area', value: selectedCriteria.area, display: selectedCriteria.area },
      { key: 'field', value: selectedCriteria.field, display: selectedCriteria.field },
      { key: 'school', value: selectedCriteria.school, display: selectedCriteria.school },
    ].filter((f) => f.value);

    return (
      <div className="flex flex-wrap gap-2 px-3 pb-3 sm:hidden">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              onDraftAdvancedFilterChange({ ...draftAdvancedFilters, [filter.key]: '' });
              onApplyAdvancedFilters();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green/10 text-green rounded-full border border-green/20 hover:bg-green/20 transition-colors"
          >
            <span className="max-w-[120px] truncate">{filter.display}</span>
            <X className="w-3.5 h-3.5 flex-shrink-0" />
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('clear')}
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl w-full mx-auto mb-4 sm:mb-8 px-2"
    >
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="px-3 pt-4 pb-3 sm:px-6 sm:pt-8 sm:pb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-6 sm:h-6 pointer-events-none z-10" />
            <Input
              ref={searchInputRef}
              id="text-search"
              type="text"
              value={localSearchValue}
              onChange={(e) => handleTextSearchChange(e.target.value)}
              placeholder={t('placeholder')}
              data-testid="text-search-input"
              className="pl-10 pr-24 sm:pl-16 sm:pr-28 h-12 sm:h-16 text-base sm:text-lg bg-white text-foreground border-input focus:ring-2 focus:ring-green/30 focus-visible:ring-2 focus-visible:ring-green/30 border-2 shadow-sm hover:shadow-md transition-shadow"
              aria-disabled={isSearching}
            />
            {!localSearchValue && !isSearching && (
              <kbd className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            )}
            {isSearching && (
              <div className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-10">
                <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
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
        <div className="px-3 pb-3 pt-1 sm:hidden border-t border-border/50">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between py-3 px-0 text-left active:opacity-70 transition-opacity"
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
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle className="flex items-center justify-between">
                  <span>{t('filters')}</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-sm font-normal text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t('clear')}
                    </button>
                  )}
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-4 overflow-y-auto">
                <FilterContent isMobile />
              </div>
              <DrawerFooter className="border-t border-border pt-4">
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

        {/* Desktop: Collapsible filters */}
        <div className="px-3 pb-3 pt-3 sm:px-6 border-t border-border/50 hidden sm:block">
          <Collapsible open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between py-1 sm:py-1.5 px-0 text-left hover:opacity-70 transition-opacity group"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('filters')}
                  </span>
                  {hasActiveFilters && (
                    <span className="ml-1 px-1 py-0.5 sm:ml-1.5 sm:px-1.5 text-[9px] sm:text-[10px] bg-green text-white rounded-full font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {isAdvancedSearchOpen ? (
                  <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 sm:mt-3 border-l border-muted/30 pl-3">
              <FilterContent />

              {hasDraftChanges && (
                <Button
                  type="button"
                  onClick={handleApplyFilters}
                  className="h-9 sm:h-10 text-xs sm:text-sm bg-green hover:bg-green/90 text-white mt-3"
                >
                  {t('filter')} {draftFilterResultCount >= 0 && `(${draftFilterResultCount})`}
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {hasActiveFilters && (
          <div className="px-3 pb-3 sm:px-6 sm:pb-6 hidden sm:flex mt-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="h-9 sm:h-10 text-xs sm:text-sm bg-white text-foreground border-input hover:bg-muted flex-1"
              type="button"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t('clear')}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
