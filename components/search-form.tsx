"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Search as SearchIcon,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
} from "lucide-react";
import { Criteria, ColorKey } from "./search-container";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import type { ColorData } from "@/lib/load-color-data";
import { track } from "@databuddy/sdk";
import { useTranslations, useLocale } from 'next-intl';
import translationsData from '../data/translations.json';

type OptionWithCount = {
  value: string;
  count: number;
};

interface SearchFormProps {
  onTextSearchChange: (textSearch: string) => void;
  onDraftAdvancedFilterChange: (filters: Omit<Criteria, "textSearch">) => void;
  onApplyAdvancedFilters: () => void;
  onClearAll: () => void;
  colorOptions: Array<{ value: ColorKey; count: number }>;
  areaOptions: OptionWithCount[];
  fieldOptions: OptionWithCount[];
  schoolOptions: OptionWithCount[];
  selectedCriteria: Criteria;
  draftAdvancedFilters: Omit<Criteria, "textSearch">;
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
  colorOptions,
  areaOptions,
  fieldOptions,
  schoolOptions,
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
    type: 'color' | 'area' | 'field' | 'university'
  ): string => {
    const translationsMap =
      type === 'color' ? translations.colors :
        type === 'area' ? translations.areas :
          type === 'field' ? translations.fields :
            translations.universities;

    const translation = translationsMap[value];
    return translation?.[locale] || value;
  };

  // Translate color options for display (colors need translation since colorData uses Finnish keys)
  const translatedColorOptions = useMemo(() => {
    return Object.entries(colorData.colors).map(([colorKey, data]) => ({
      key: colorKey,
      displayName: translateEntity(colorKey, 'color'),
      data,
    }));
  }, [locale]);

  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(
    selectedCriteria.textSearch
  );
  const lastTrackedSearchRef = useRef<string>("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const collapsibleContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearchValue(selectedCriteria.textSearch);
  }, [selectedCriteria.textSearch]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (isAdvancedSearchOpen) {
          setIsAdvancedSearchOpen(false);
        }
        setCommandOpen(false);
      }
    };
    document.addEventListener("keydown", down, true);
    return () => document.removeEventListener("keydown", down, true);
  }, [isAdvancedSearchOpen]);

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
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [commandOpen]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const wasEmpty = !lastTrackedSearchRef.current;
      const isEmpty = !localSearchValue.trim();

      if (wasEmpty && !isEmpty) {
        track("search_change", {
          button_text: "Text search change",
          location: "search_form",
        });
        lastTrackedSearchRef.current = localSearchValue;
      } else if (isEmpty) {
        lastTrackedSearchRef.current = "";
      }

      onTextSearchChange(localSearchValue);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localSearchValue, onTextSearchChange]);

  const handleTextSearchChange = (value: string) => {
    setLocalSearchValue(value);
  };

  const toggleArrayFilter = (
    field: "colors" | "areas" | "fields" | "schools",
    value: string | ColorKey
  ) => {
    const currentArray = draftAdvancedFilters[field] as string[];
    const newArray = currentArray.includes(value as string)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value as string];
    onDraftAdvancedFilterChange({ ...draftAdvancedFilters, [field]: newArray });
  };

  const handleApplyFilters = () => {
    track("advanced_filters", {
      button_text: "Advanced filters apply",
      location: "search_form",
    });
    onApplyAdvancedFilters();
  };

  const handleClear = () => {
    onClearAll();
    setIsAdvancedSearchOpen(false);
  };

  const removeFilter = (
    field: "colors" | "areas" | "fields" | "schools",
    value: string
  ) => {
    const newCriteria = {
      ...selectedCriteria,
      [field]: (selectedCriteria[field] as string[]).filter((v) => v !== value),
    };
    onDraftAdvancedFilterChange({
      colors: newCriteria.colors,
      areas: newCriteria.areas,
      fields: newCriteria.fields,
      schools: newCriteria.schools,
    });
    onApplyAdvancedFilters();
  };

  const hasActiveFilters =
    selectedCriteria.colors.length > 0 ||
    selectedCriteria.areas.length > 0 ||
    selectedCriteria.fields.length > 0 ||
    selectedCriteria.schools.length > 0;

  const hasDraftChanges =
    JSON.stringify(draftAdvancedFilters.colors.sort()) !== JSON.stringify(selectedCriteria.colors.sort()) ||
    JSON.stringify(draftAdvancedFilters.areas.sort()) !== JSON.stringify(selectedCriteria.areas.sort()) ||
    JSON.stringify(draftAdvancedFilters.fields.sort()) !== JSON.stringify(selectedCriteria.fields.sort()) ||
    JSON.stringify(draftAdvancedFilters.schools.sort()) !== JSON.stringify(selectedCriteria.schools.sort());

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
              className="pl-10 pr-24 sm:pl-16 sm:pr-28 h-12 sm:h-16 text-base sm:text-lg bg-white text-foreground border-input focus:ring-2 focus:ring-green/30 focus-visible:ring-2 focus-visible:ring-green/30 border-2 shadow-sm hover:shadow-md transition-shadow"
              aria-disabled={isSearching}
            />
            {!localSearchValue && !isSearching && (
              <kbd className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
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
                onClick={() => handleTextSearchChange("")}
                className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1 sm:p-2 rounded hover:bg-muted z-10"
                aria-label={t('clearSearch')}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="px-3 sm:px-6 pb-3 pt-3 border-t border-border/50">
          <Collapsible
            open={isAdvancedSearchOpen}
            onOpenChange={setIsAdvancedSearchOpen}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between py-1 sm:py-1.5 px-0 text-left hover:opacity-70 transition-opacity group"
                aria-expanded={isAdvancedSearchOpen}
                aria-controls="advanced-filters-content"
                aria-label={isAdvancedSearchOpen ? "Close advanced filters" : "Open advanced filters"}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('filters')}
                  </span>
                  {hasActiveFilters && (
                    <span className="ml-1 px-1 py-0.5 sm:ml-1.5 sm:px-1.5 text-[9px] sm:text-[10px] bg-green text-white rounded-full font-medium" aria-label={`${selectedCriteria.colors.length + selectedCriteria.areas.length + selectedCriteria.fields.length + selectedCriteria.schools.length} active filters`}>
                      {
                        selectedCriteria.colors.length +
                        selectedCriteria.areas.length +
                        selectedCriteria.fields.length +
                        selectedCriteria.schools.length
                      }
                    </span>
                  )}
                </div>
                {isAdvancedSearchOpen ? (
                  <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" aria-hidden="true" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent
              ref={collapsibleContentRef}
              id="advanced-filters-content"
              className="mt-3 sm:mt-3 space-y-0"
              role="region"
              aria-label="Advanced filter options"
            >
              <div className="space-y-1.5 py-3 border-b border-border/30 last:border-b-0">
                <Label className="text-sm sm:text-xs font-medium text-foreground">
                  {t('color')}
                </Label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {translatedColorOptions.map(({ key, displayName, data }) => {
                    const optionData = colorOptions.find((opt) => opt.value === key);
                    const count = optionData?.count || 0;
                    const isDisabled = count === 0;
                    return (
                      <label
                        key={key}
                        className={`flex items-center justify-between gap-2 rounded-md p-2 sm:p-2 transition-colors ${isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted/60"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-2">
                          <Checkbox
                            checked={draftAdvancedFilters.colors.includes(key as ColorKey)}
                            onCheckedChange={() =>
                              !isDisabled && toggleArrayFilter("colors", key)
                            }
                            disabled={isDisabled}
                          />
                          <div
                            className="w-4 h-4 rounded border flex-shrink-0"
                            style={{
                              backgroundColor: data.color,
                            }}
                          />
                          <span className="text-sm sm:text-sm text-foreground">
                            {displayName}
                          </span>
                        </div>
                        <span className="text-xs sm:text-xs text-muted-foreground font-medium">
                          ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 py-3 border-b border-border/30 last:border-b-0">
                <Label className="text-sm sm:text-xs font-medium text-foreground">
                  {t('city')}
                </Label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {areaOptions.map(({ value: area, count }) => {
                    const isDisabled = count === 0;
                    return (
                      <label
                        key={area}
                        className={`flex items-center justify-between gap-2 rounded-md p-2 sm:p-2 transition-colors ${isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted/60"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-2">
                          <Checkbox
                            checked={draftAdvancedFilters.areas.includes(area)}
                            onCheckedChange={() =>
                              !isDisabled && toggleArrayFilter("areas", area)
                            }
                            disabled={isDisabled}
                          />
                          <span className="text-sm sm:text-sm text-foreground">{area}</span>
                        </div>
                        <span className="text-xs sm:text-xs text-muted-foreground font-medium">
                          ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 py-3 border-b border-border/30 last:border-b-0">
                <Label className="text-sm sm:text-xs font-medium text-foreground">
                  {t('field')}
                </Label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {fieldOptions.map(({ value: field, count }) => {
                    const isDisabled = count === 0;
                    return (
                      <label
                        key={field}
                        className={`flex items-center justify-between gap-2 rounded-md p-2 sm:p-2 transition-colors ${isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted/60"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-2">
                          <Checkbox
                            checked={draftAdvancedFilters.fields.includes(field)}
                            onCheckedChange={() =>
                              !isDisabled && toggleArrayFilter("fields", field)
                            }
                            disabled={isDisabled}
                          />
                          <span className="text-sm sm:text-sm text-foreground">{field}</span>
                        </div>
                        <span className="text-xs sm:text-xs text-muted-foreground font-medium">
                          ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 py-3 border-b border-border/30 last:border-b-0">
                <Label className="text-sm sm:text-xs font-medium text-foreground">
                  {t('school')}
                </Label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {schoolOptions.map(({ value: school, count }) => {
                    const isDisabled = count === 0;
                    return (
                      <label
                        key={school}
                        className={`flex items-center justify-between gap-2 rounded-md p-2 sm:p-2 transition-colors ${isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted/60"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-2">
                          <Checkbox
                            checked={draftAdvancedFilters.schools.includes(school)}
                            onCheckedChange={() =>
                              !isDisabled && toggleArrayFilter("schools", school)
                            }
                            disabled={isDisabled}
                          />
                          <span className="text-sm sm:text-sm text-foreground">{school}</span>
                        </div>
                        <span className="text-xs sm:text-xs text-muted-foreground font-medium">
                          ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {hasDraftChanges && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-2 sm:mt-3">
                    <Button
                      type="button"
                      onClick={handleApplyFilters}
                      className="h-10 sm:h-10 text-sm sm:text-sm bg-green hover:bg-green/90 text-white flex-1"
                    >
                      {t('filter')}{" "}
                      {draftFilterResultCount >= 0 && `(${draftFilterResultCount})`}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="h-10 sm:h-10 text-sm sm:text-sm mt-2 sm:mt-0 border-border/70 hover:bg-muted flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('clear')}
                    </Button>
                  </div>
                  <div
                    className="sr-only"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {draftFilterResultCount} results will be shown when filters are applied
                  </div>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {hasActiveFilters && (
          <>
            <div className="px-3 sm:px-6 pb-2 sm:pb-3">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {selectedCriteria.colors.map((color) => {
                  const colorInfo = translatedColorOptions.find((c) => c.key === color);
                  return (
                    <Badge
                      key={`color-${color}`}
                      variant="secondary"
                      className="flex items-center gap-1 sm:gap-1.5 pr-1 text-[10px] sm:text-xs"
                    >
                      <div
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border"
                        style={{
                          backgroundColor: colorInfo?.data.color,
                        }}
                      />
                      {colorInfo?.displayName}
                      <button
                        type="button"
                        onClick={() => removeFilter("colors", color)}
                        className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                        aria-label={`Remove ${colorInfo?.displayName} filter`}
                      >
                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                      </button>
                    </Badge>
                  );
                })}
                {selectedCriteria.areas.map((area) => (
                  <Badge
                    key={`area-${area}`}
                    variant="secondary"
                    className="flex items-center gap-1 sm:gap-1.5 pr-1 text-[10px] sm:text-xs"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeFilter("areas", area)}
                      className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                      aria-label={`Remove ${area} filter`}
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
                {selectedCriteria.fields.map((field) => (
                  <Badge
                    key={`field-${field}`}
                    variant="secondary"
                    className="flex items-center gap-1 sm:gap-1.5 pr-1 text-[10px] sm:text-xs"
                  >
                    {field}
                    <button
                      type="button"
                      onClick={() => removeFilter("fields", field)}
                      className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                      aria-label={`Remove ${field} filter`}
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
                {selectedCriteria.schools.map((school) => (
                  <Badge
                    key={`school-${school}`}
                    variant="secondary"
                    className="flex items-center gap-1 sm:gap-1.5 pr-1 text-[10px] sm:text-xs"
                  >
                    {school}
                    <button
                      type="button"
                      onClick={() => removeFilter("schools", school)}
                      className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                      aria-label={`Remove ${school} filter`}
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="px-3 pb-3 sm:px-6 sm:pb-6 flex">
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
          </>
        )}
      </div>
    </motion.div>
  );
}
