"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocale } from 'next-intl';
import SearchForm from "./search-form";
import ResultsDisplay from "./result-display";
import PlaceholderDisplay from "./placeholder-display";
import {
  searchUniversitiesAPI,
} from "@/lib/search-utils";
import type { ColorData } from "@/lib/load-color-data";
import {
  getUniqueAreas,
  getUniqueFields,
  getUniqueUniversities,
} from "@/lib/get-unique-values";
import type { University } from "@/types/university";

export type Criteria = {
  textSearch: string;
  color:
  | ""
  | "punainen"
  | "sininen"
  | "vihreä"
  | "keltainen"
  | "oranssi"
  | "violetti"
  | "pinkki"
  | "black"
  | "white";
  area: string;
  field: string;
  school: string;
};

interface SearchContainerProps {
  initialUniversities: University[];
  colorData: ColorData;
}

export default function SearchContainer({
  initialUniversities,
  colorData,
}: SearchContainerProps) {
  const locale = useLocale() as 'fi' | 'en' | 'sv';
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria>({
    textSearch: "",
    color: "",
    area: "",
    field: "",
    school: "",
  });

  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<
    Omit<Criteria, "textSearch">
  >({
    color: "",
    area: "",
    field: "",
    school: "",
  });

  const [results, setResults] = useState<University[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const applyFilters = useCallback(
    (universities: University[]): University[] => {
      return universities.filter((uni) => {
        const colorMatch = selectedCriteria.color
          ? [...colorData.colors[selectedCriteria.color].main, ...colorData.colors[selectedCriteria.color].shades]
            .some((c) => uni.vari.toLowerCase().includes(c.toLowerCase()))
          : true;
        const areaMatch =
          !selectedCriteria.area ||
          uni.alue.toLowerCase().includes(selectedCriteria.area.toLowerCase());
        const fieldMatch =
          !selectedCriteria.field ||
          uni.ala?.toLowerCase().includes(selectedCriteria.field.toLowerCase());
        const schoolMatch =
          !selectedCriteria.school ||
          uni.oppilaitos
            .toLowerCase()
            .includes(selectedCriteria.school.toLowerCase());
        return colorMatch && areaMatch && fieldMatch && schoolMatch;
      });
    },
    [
      selectedCriteria.color,
      selectedCriteria.area,
      selectedCriteria.field,
      selectedCriteria.school,
    ]
  );

  const performSearch = useCallback(async () => {
    let searchResults: University[] = [];

    if (selectedCriteria.textSearch.trim().length >= 3) {
      try {
        searchResults = await searchUniversitiesAPI(
          selectedCriteria.textSearch.trim(),
          locale
        );
      } catch (error) {
        console.error("Search failed");
        searchResults = [];
      }
    } else {
      searchResults = initialUniversities;
    }

    const filteredResults = applyFilters(searchResults);

    const orderedResults = filteredResults.sort((a, b) => {
      if (a.oppilaitos === b.oppilaitos) {
        if (!a.ainejärjestö && !b.ainejärjestö) return 0;
        if (!a.ainejärjestö) return 1;
        if (!b.ainejärjestö) return -1;
        return a.ainejärjestö.localeCompare(b.ainejärjestö);
      }
      return a.oppilaitos.localeCompare(b.oppilaitos);
    });

    setResults(orderedResults);
    setHasSearched(true);
    setIsSearching(false);
  }, [selectedCriteria, applyFilters, initialUniversities, locale]);

  // Load all data on initial mount
  useEffect(() => {
    if (!hasSearched) {
      const sortedResults = initialUniversities.sort((a, b) => {
        if (a.oppilaitos === b.oppilaitos) {
          if (!a.ainejärjestö && !b.ainejärjestö) return 0;
          if (!a.ainejärjestö) return 1;
          if (!b.ainejärjestö) return -1;
          return a.ainejärjestö.localeCompare(b.ainejärjestö);
        }
        return a.oppilaitos.localeCompare(b.oppilaitos);
      });
      setResults(sortedResults);
      setHasSearched(true);
    }
  }, [hasSearched, initialUniversities]);

  useEffect(() => {
    const hasTextSearch = selectedCriteria.textSearch.trim().length >= 3;
    const hasFilters =
      selectedCriteria.color ||
      selectedCriteria.area ||
      selectedCriteria.field ||
      selectedCriteria.school;

    // If user clears everything, show all data again
    if (hasSearched && !hasTextSearch && !hasFilters) {
      const sortedResults = initialUniversities.sort((a, b) => {
        if (a.oppilaitos === b.oppilaitos) {
          if (!a.ainejärjestö && !b.ainejärjestö) return 0;
          if (!a.ainejärjestö) return 1;
          if (!b.ainejärjestö) return -1;
          return a.ainejärjestö.localeCompare(b.ainejärjestö);
        }
        return a.oppilaitos.localeCompare(b.oppilaitos);
      });
      setResults(sortedResults);
      return;
    }

    // Only perform search if user has entered text or applied filters
    if (hasTextSearch || hasFilters) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        setIsSearching(false);
      };
    }
  }, [performSearch, selectedCriteria, hasSearched, initialUniversities]);

  const handleTextSearchChange = useCallback((textSearch: string) => {
    setSelectedCriteria((prev) => ({ ...prev, textSearch }));
  }, []);

  const handleDraftAdvancedFilterChange = useCallback(
    (filters: Omit<Criteria, "textSearch">) => {
      setDraftAdvancedFilters(filters);
    },
    []
  );

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
      textSearch: "",
      color: "",
      area: "",
      field: "",
      school: "",
    });
    setDraftAdvancedFilters({
      color: "",
      area: "",
      field: "",
      school: "",
    });
  }, []);

  const [draftFilterResultCount, setDraftFilterResultCount] = useState(0);

  useEffect(() => {
      const calculateDraftFilterResultCount = async () => {
      let searchResults: University[] = [];

      if (selectedCriteria.textSearch.trim().length >= 3) {
        try {
          searchResults = await searchUniversitiesAPI(
            selectedCriteria.textSearch.trim(),
            locale
          );
        } catch (error) {
          console.error("API search failed in draftFilterResultCount:", error);
          searchResults = [];
        }
      } else {
        searchResults = initialUniversities;
      }

      const filteredResults = searchResults.filter((uni) => {
        const colorMatch = draftAdvancedFilters.color
          ? [...colorData.colors[draftAdvancedFilters.color].main, ...colorData.colors[draftAdvancedFilters.color].shades]
            .some((c) => uni.vari.toLowerCase().includes(c.toLowerCase()))
          : true;
        const areaMatch =
          !draftAdvancedFilters.area ||
          uni.alue
            .toLowerCase()
            .includes(draftAdvancedFilters.area.toLowerCase());
        const fieldMatch =
          !draftAdvancedFilters.field ||
          uni.ala
            ?.toLowerCase()
            .includes(draftAdvancedFilters.field.toLowerCase());
        const schoolMatch =
          !draftAdvancedFilters.school ||
          uni.oppilaitos
            .toLowerCase()
            .includes(draftAdvancedFilters.school.toLowerCase());
        return colorMatch && areaMatch && fieldMatch && schoolMatch;
      });

      setDraftFilterResultCount(filteredResults.length);
    };

    calculateDraftFilterResultCount();
  }, [selectedCriteria.textSearch, draftAdvancedFilters, initialUniversities, locale]);

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
    (uni: University, ignore?: "color" | "area" | "field" | "school") => {
      const colorMatch =
        ignore === "color" || !draftAdvancedFilters.color
          ? true
          : [...colorData.colors[draftAdvancedFilters.color].main, ...colorData.colors[draftAdvancedFilters.color].shades]
            .some((c) => uni.vari.toLowerCase().includes(c.toLowerCase()));

      const areaMatch =
        ignore === "area" ||
        !draftAdvancedFilters.area ||
        uni.alue
          .toLowerCase()
          .includes(draftAdvancedFilters.area.toLowerCase());

      const fieldMatch =
        ignore === "field" ||
        !draftAdvancedFilters.field ||
        uni.ala
          ?.toLowerCase()
          .includes(draftAdvancedFilters.field.toLowerCase());

      const schoolMatch =
        ignore === "school" ||
        !draftAdvancedFilters.school ||
        uni.oppilaitos
          .toLowerCase()
          .includes(draftAdvancedFilters.school.toLowerCase());

      return colorMatch && areaMatch && fieldMatch && schoolMatch;
    },
    [draftAdvancedFilters]
  );

  const areaOptions = useMemo(
    () =>
      getUniqueAreas(
        initialUniversities.filter((uni) => matchesDraftFilters(uni, "area"))
      ),
    [initialUniversities, matchesDraftFilters]
  );
  const fieldOptions = useMemo(
    () =>
      getUniqueFields(
        initialUniversities.filter((uni) => matchesDraftFilters(uni, "field"))
      ),
    [initialUniversities, matchesDraftFilters]
  );
  const schoolOptions = useMemo(
    () =>
      getUniqueUniversities(
        initialUniversities.filter((uni) => matchesDraftFilters(uni, "school"))
      ),
    [initialUniversities, matchesDraftFilters]
  );

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
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResultsDisplay results={results} />
        </motion.div>
      )}
      {hasSearched && results.length === 0 && (
        <div className="bg-gray-100 rounded-lg shadow-lg p-8 max-w-xl mx-auto text-center">
          <p className="text-gray-600 text-lg">
            Haku ei tuottanut tuloksia. Kokeile muokata hakuehtoja.
          </p>
        </div>
      )}
      {!hasSearched && results.length === 0 && <PlaceholderDisplay />}
    </div>
  );
}
