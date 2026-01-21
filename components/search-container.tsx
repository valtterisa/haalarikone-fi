"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

export type ColorKey =
  | "punainen"
  | "sininen"
  | "vihreä"
  | "keltainen"
  | "oranssi"
  | "violetti"
  | "pinkki"
  | "black"
  | "white";

export type Criteria = {
  textSearch: string;
  colors: ColorKey[];
  areas: string[];
  fields: string[];
  schools: string[];
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedCriteria, setSelectedCriteria] = useState<Criteria>(() => {
    const colors = searchParams.get("colors")?.split(",").filter(Boolean) as ColorKey[] || [];
    const areas = searchParams.get("areas")?.split(",").filter(Boolean) || [];
    const fields = searchParams.get("fields")?.split(",").filter(Boolean) || [];
    const schools = searchParams.get("schools")?.split(",").filter(Boolean) || [];
    const textSearch = searchParams.get("q") || "";
    
    return {
      textSearch,
      colors,
      areas,
      fields,
      schools,
    };
  });

  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<
    Omit<Criteria, "textSearch">
  >({
    colors: [],
    areas: [],
    fields: [],
    schools: [],
  });

  const [results, setResults] = useState<University[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, University[]>>(
    new Map()
  );

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCriteria.textSearch) {
      params.set("q", selectedCriteria.textSearch);
    }
    if (selectedCriteria.colors.length > 0) {
      params.set("colors", selectedCriteria.colors.join(","));
    }
    if (selectedCriteria.areas.length > 0) {
      params.set("areas", selectedCriteria.areas.join(","));
    }
    if (selectedCriteria.fields.length > 0) {
      params.set("fields", selectedCriteria.fields.join(","));
    }
    if (selectedCriteria.schools.length > 0) {
      params.set("schools", selectedCriteria.schools.join(","));
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.replace(newUrl, { scroll: false });
  }, [selectedCriteria, pathname, router]);

  const applyFilters = useCallback(
    (universities: University[]): University[] => {
      return universities.filter((uni) => {
        const colorMatch =
          selectedCriteria.colors.length === 0 ||
          selectedCriteria.colors.some((colorKey) => {
            const colorVariants = [
              ...colorData.colors[colorKey].main,
              ...colorData.colors[colorKey].shades,
            ];
            return colorVariants.some((c) =>
              uni.vari.toLowerCase().includes(c.toLowerCase())
            );
          });

        const areaMatch =
          selectedCriteria.areas.length === 0 ||
          selectedCriteria.areas.some((area) =>
            uni.alue.toLowerCase().includes(area.toLowerCase())
          );

        const fieldMatch =
          selectedCriteria.fields.length === 0 ||
          selectedCriteria.fields.some((field) =>
            uni.ala?.toLowerCase().includes(field.toLowerCase())
          );

        const schoolMatch =
          selectedCriteria.schools.length === 0 ||
          selectedCriteria.schools.some((school) =>
            uni.oppilaitos.toLowerCase().includes(school.toLowerCase())
          );

        return colorMatch && areaMatch && fieldMatch && schoolMatch;
      });
    },
    [
      selectedCriteria.colors,
      selectedCriteria.areas,
      selectedCriteria.fields,
      selectedCriteria.schools,
      colorData,
    ]
  );

  const performSearch = useCallback(async () => {
    let searchResults: University[] = [];
    const searchQuery = selectedCriteria.textSearch.trim();

    if (searchQuery.length >= 3) {
      if (searchCache.has(searchQuery)) {
        searchResults = searchCache.get(searchQuery)!;
      } else {
        try {
          searchResults = await searchUniversitiesAPI(searchQuery, locale);
          setSearchCache((prev) => new Map(prev).set(searchQuery, searchResults));
        } catch (error) {
          console.error("Search failed");
          searchResults = [];
        }
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
  }, [selectedCriteria, applyFilters, initialUniversities, locale, searchCache]);

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
      selectedCriteria.colors.length > 0 ||
      selectedCriteria.areas.length > 0 ||
      selectedCriteria.fields.length > 0 ||
      selectedCriteria.schools.length > 0;

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
      colors: draftAdvancedFilters.colors,
      areas: draftAdvancedFilters.areas,
      fields: draftAdvancedFilters.fields,
      schools: draftAdvancedFilters.schools,
    }));
  }, [draftAdvancedFilters]);

  const handleClearAll = useCallback(() => {
    setSelectedCriteria({
      textSearch: "",
      colors: [],
      areas: [],
      fields: [],
      schools: [],
    });
    setDraftAdvancedFilters({
      colors: [],
      areas: [],
      fields: [],
      schools: [],
    });
  }, []);

  const [draftFilterResultCount, setDraftFilterResultCount] = useState(0);

  useEffect(() => {
    const calculateDraftFilterResultCount = async () => {
      let searchResults: University[] = [];
      const searchQuery = selectedCriteria.textSearch.trim();

      if (searchQuery.length >= 3) {
        if (searchCache.has(searchQuery)) {
          searchResults = searchCache.get(searchQuery)!;
        } else {
          try {
            searchResults = await searchUniversitiesAPI(searchQuery, locale);
            setSearchCache((prev) => new Map(prev).set(searchQuery, searchResults));
          } catch (error) {
            console.error("API search failed in draftFilterResultCount:", error);
            searchResults = [];
          }
        }
      } else {
        searchResults = initialUniversities;
      }

      const filteredResults = searchResults.filter((uni) => {
        const colorMatch =
          draftAdvancedFilters.colors.length === 0 ||
          draftAdvancedFilters.colors.some((colorKey) => {
            const colorVariants = [
              ...colorData.colors[colorKey].main,
              ...colorData.colors[colorKey].shades,
            ];
            return colorVariants.some((c) =>
              uni.vari.toLowerCase().includes(c.toLowerCase())
            );
          });

        const areaMatch =
          draftAdvancedFilters.areas.length === 0 ||
          draftAdvancedFilters.areas.some((area) =>
            uni.alue.toLowerCase().includes(area.toLowerCase())
          );

        const fieldMatch =
          draftAdvancedFilters.fields.length === 0 ||
          draftAdvancedFilters.fields.some((field) =>
            uni.ala?.toLowerCase().includes(field.toLowerCase())
          );

        const schoolMatch =
          draftAdvancedFilters.schools.length === 0 ||
          draftAdvancedFilters.schools.some((school) =>
            uni.oppilaitos.toLowerCase().includes(school.toLowerCase())
          );

        return colorMatch && areaMatch && fieldMatch && schoolMatch;
      });

      setDraftFilterResultCount(filteredResults.length);
    };

    const timeoutId = setTimeout(() => {
      calculateDraftFilterResultCount();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [
    selectedCriteria.textSearch,
    draftAdvancedFilters,
    initialUniversities,
    locale,
    searchCache,
    colorData,
  ]);

  useEffect(() => {
    setDraftAdvancedFilters({
      colors: selectedCriteria.colors,
      areas: selectedCriteria.areas,
      fields: selectedCriteria.fields,
      schools: selectedCriteria.schools,
    });
  }, [
    selectedCriteria.colors,
    selectedCriteria.areas,
    selectedCriteria.fields,
    selectedCriteria.schools,
  ]);

  const matchesDraftFilters = useCallback(
    (uni: University, ignore?: "colors" | "areas" | "fields" | "schools") => {
      const colorMatch =
        ignore === "colors" ||
        draftAdvancedFilters.colors.length === 0 ||
        draftAdvancedFilters.colors.some((colorKey) => {
          const colorVariants = [
            ...colorData.colors[colorKey].main,
            ...colorData.colors[colorKey].shades,
          ];
          return colorVariants.some((c) =>
            uni.vari.toLowerCase().includes(c.toLowerCase())
          );
        });

      const areaMatch =
        ignore === "areas" ||
        draftAdvancedFilters.areas.length === 0 ||
        draftAdvancedFilters.areas.some((area) =>
          uni.alue.toLowerCase().includes(area.toLowerCase())
        );

      const fieldMatch =
        ignore === "fields" ||
        draftAdvancedFilters.fields.length === 0 ||
        draftAdvancedFilters.fields.some((field) =>
          uni.ala?.toLowerCase().includes(field.toLowerCase())
        );

      const schoolMatch =
        ignore === "schools" ||
        draftAdvancedFilters.schools.length === 0 ||
        draftAdvancedFilters.schools.some((school) =>
          uni.oppilaitos.toLowerCase().includes(school.toLowerCase())
        );

      return colorMatch && areaMatch && fieldMatch && schoolMatch;
    },
    [draftAdvancedFilters, colorData]
  );

  const colorOptionsWithCounts = useMemo(() => {
    return Object.keys(colorData.colors).map((colorKey) => {
      const count = initialUniversities.filter((uni) => {
        if (!matchesDraftFilters(uni, "colors")) return false;
        const colorVariants = [
          ...colorData.colors[colorKey].main,
          ...colorData.colors[colorKey].shades,
        ];
        return colorVariants.some((c) =>
          uni.vari.toLowerCase().includes(c.toLowerCase())
        );
      }).length;
      return { value: colorKey as ColorKey, count };
    });
  }, [initialUniversities, matchesDraftFilters, colorData]);

  const areaOptionsWithCounts = useMemo(() => {
    const areas = getUniqueAreas(
      initialUniversities.filter((uni) => matchesDraftFilters(uni, "areas"))
    );
    return areas.map((area) => {
      const count = initialUniversities.filter((uni) => {
        if (!matchesDraftFilters(uni, "areas")) return false;
        return uni.alue.toLowerCase().includes(area.toLowerCase());
      }).length;
      return { value: area, count };
    });
  }, [initialUniversities, matchesDraftFilters]);

  const fieldOptionsWithCounts = useMemo(() => {
    const fields = getUniqueFields(
      initialUniversities.filter((uni) => matchesDraftFilters(uni, "fields"))
    );
    return fields.map((field) => {
      const count = initialUniversities.filter((uni) => {
        if (!matchesDraftFilters(uni, "fields")) return false;
        return uni.ala?.toLowerCase().includes(field.toLowerCase());
      }).length;
      return { value: field, count };
    });
  }, [initialUniversities, matchesDraftFilters]);

  const schoolOptionsWithCounts = useMemo(() => {
    const schools = getUniqueUniversities(
      initialUniversities.filter((uni) => matchesDraftFilters(uni, "schools"))
    );
    return schools.map((school) => {
      const count = initialUniversities.filter((uni) => {
        if (!matchesDraftFilters(uni, "schools")) return false;
        return uni.oppilaitos.toLowerCase().includes(school.toLowerCase());
      }).length;
      return { value: school, count };
    });
  }, [initialUniversities, matchesDraftFilters]);

  return (
    <div className="w-full">
      <SearchForm
        onTextSearchChange={handleTextSearchChange}
        onDraftAdvancedFilterChange={handleDraftAdvancedFilterChange}
        onApplyAdvancedFilters={handleApplyAdvancedFilters}
        onClearAll={handleClearAll}
        colorOptions={colorOptionsWithCounts}
        areaOptions={areaOptionsWithCounts}
        fieldOptions={fieldOptionsWithCounts}
        schoolOptions={schoolOptionsWithCounts}
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
