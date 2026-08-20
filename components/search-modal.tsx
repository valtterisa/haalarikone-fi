'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from '@/i18n/routing';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MagnifyingGlass as SearchIcon, X, CircleNotch, CaretRight } from '@phosphor-icons/react';
import { searchUniversitiesAPI, type ClientSearchContext } from '@/lib/search-utils';
import { parseStyles } from '@/lib/utils';
import type { University } from '@/types/university';
import { useTranslations } from 'next-intl';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';
import { useLocale } from 'next-intl';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';
import { Button } from './ui/button';

type SearchModalContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  results: University[];
  isSearching: boolean;
  showAllHaalarit: boolean;
  setShowAllHaalarit: (show: boolean) => void;
  handleSelect: (uni: University) => void;
  handleColorClick: (color: string) => void;
  handleInstitutionClick: (institution: string) => void;
  groupedByColor: Map<string, { unis: University[]; hex: string | null }>;
  groupedByInstitution: Map<string, University[]>;
  placeholder: string;
  modalTitle: string;
};

const SearchModalContext = createContext<SearchModalContextValue | null>(null);

function useSearchModal() {
  const ctx = useContext(SearchModalContext);
  if (!ctx) {
    throw new Error('SearchModal compound parts must be used within SearchModal');
  }
  return ctx;
}

type SearchModalRootProps = {
  children: ReactNode;
  placeholder: string;
  modalTitle: string;
  clientSearchContext?: ClientSearchContext;
};

export function SearchModalRoot({
  children,
  placeholder,
  modalTitle,
  clientSearchContext,
}: SearchModalRootProps) {
  const locale = useLocale() as Locale;
  const routes = useTranslatedRoutes();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<University[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllHaalarit, setShowAllHaalarit] = useState(false);
  const requestIdRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setResults([]);
      setShowAllHaalarit(false);
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      requestIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      return;
    }

    setShowAllHaalarit(false);
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    const timeoutId = setTimeout(() => {
      const runSearch = async () => {
        setIsSearching(true);
        try {
          const searchResults = await searchUniversitiesAPI(
            searchQuery.trim(),
            locale,
            clientSearchContext,
          );
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          setResults(searchResults);
        } catch (error) {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          if (requestIdRef.current === currentRequestId) {
            setIsSearching(false);
          }
        }
      };

      void runSearch();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, locale, clientSearchContext]);

  const handleSelect = (uni: University) => {
    router.push(routes.overall(uni.slug));
    setOpen(false);
  };

  const handleColorClick = (color: string) => {
    router.push(routes.colors(getSlugForEntity(color, locale, 'color')));
    setOpen(false);
  };

  const handleInstitutionClick = (institution: string) => {
    router.push(routes.universities(getSlugForEntity(institution, locale, 'university')));
    setOpen(false);
  };

  const resultGroups = useMemo(() => {
    const groups = new Map<string, { unis: University[]; hex: string | null }>();
    const institutions = new Map<string, University[]>();

    for (const uni of results) {
      const primaryColorBase = uni.variBase?.[0] ?? uni.vari;
      let colorGroup = groups.get(primaryColorBase);
      if (!colorGroup) {
        colorGroup = { unis: [], hex: null };
        groups.set(primaryColorBase, colorGroup);
      }
      colorGroup.unis.push(uni);
      if (!colorGroup.hex && uni.hex) {
        colorGroup.hex = uni.hex;
      }

      let schoolGroup = institutions.get(uni.oppilaitos);
      if (!schoolGroup) {
        schoolGroup = [];
        institutions.set(uni.oppilaitos, schoolGroup);
      }
      schoolGroup.push(uni);
    }

    return { groups, institutions };
  }, [results]);

  const groupedByColor = resultGroups.groups;
  const groupedByInstitution = resultGroups.institutions;

  return (
    <SearchModalContext.Provider
      value={{
        open,
        setOpen,
        searchQuery,
        setSearchQuery,
        results,
        isSearching,
        showAllHaalarit,
        setShowAllHaalarit,
        handleSelect,
        handleColorClick,
        handleInstitutionClick,
        groupedByColor,
        groupedByInstitution,
        placeholder,
        modalTitle,
      }}
    >
      <div className="p-2">{children}</div>
    </SearchModalContext.Provider>
  );
}

export function SearchModalTrigger({ children }: { children: ReactNode }) {
  const { setOpen } = useSearchModal();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative h-12 w-full max-w-3xl touch-manipulation rounded-lg border-2 border-input bg-background px-10 pr-6 text-left text-base text-muted-foreground shadow-sm transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 sm:h-16 sm:px-16 sm:text-lg"
    >
      <SearchIcon
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-6 sm:h-6 sm:w-6"
        aria-hidden="true"
      />
      {children}
    </button>
  );
}

export function SearchModalContent({ children }: { children?: ReactNode }) {
  const { open, setOpen, results, isSearching, modalTitle } = useSearchModal();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`flex max-w-2xl flex-col overflow-hidden overscroll-contain rounded-2xl p-0 transition-[height] duration-300 ${
          results.length > 0 || isSearching ? 'h-[600px]' : 'h-auto'
        }`}
        hideCloseButton
      >
        <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
        {children ?? (
          <>
            <SearchModal.Input />
            <SearchModal.Results />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SearchModalInput() {
  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  const { searchQuery, setSearchQuery, isSearching, setOpen, placeholder } = useSearchModal();

  return (
    <div className="border-b px-3 pb-3 pt-4 sm:px-6 sm:pb-6 sm:pt-8">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-6 sm:h-6 sm:w-6"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            autoComplete="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-12 border-2 border-input bg-background pl-10 pr-24 text-base shadow-sm transition-shadow touch-manipulation hover:shadow-card focus-visible:ring-2 focus-visible:ring-green/30 sm:h-16 sm:pl-16 sm:pr-28 sm:text-lg"
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-6" aria-hidden="true">
              <div className="h-4 w-4 rounded-full border-2 border-green border-t-transparent motion-safe:animate-spin sm:h-6 sm:w-6" />
            </div>
          ) : null}
          {searchQuery && !isSearching ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 touch-manipulation rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 sm:right-6 sm:p-2"
              aria-label={t('clearSearch')}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-shrink-0 touch-manipulation rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
        >
          {tCommon('close')}
        </button>
      </div>
    </div>
  );
}

export function SearchModalOveralls() {
  const t = useTranslations('search');
  const tOverall = useTranslations('overall');
  const {
    results,
    handleSelect,
    showAllHaalarit,
    setShowAllHaalarit,
  } = useSearchModal();
  const visibleCount = showAllHaalarit ? results.length : 5;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        {t('overalls')} ({results.length})
      </h3>
      <div className="space-y-2">
        {results.slice(0, visibleCount).map((uni) => (
          <button
            key={uni.id}
            type="button"
            onClick={() => handleSelect(uni)}
            className="flex w-full touch-manipulation items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
          >
            <div
              className="h-10 w-10 flex-shrink-0 rounded-md border-2 shadow-sm"
              style={uni.hex ? parseStyles(uni.hex) : { backgroundColor: '#e5e7eb' }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">
                {uni.ainejarjesto || uni.ala || tOverall('unknownOrganization')}
              </div>
              <div className="text-xs text-muted-foreground">
                {uni.oppilaitos} • {uni.vari}
              </div>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" weight="regular" />
          </button>
        ))}
      </div>
      {results.length > 5 && !showAllHaalarit && (
        <Button
          variant="ghost"
          onClick={() => setShowAllHaalarit(true)}
          className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {t('showAll')} {results.length} {t('overallCount')}
          <CaretRight className="ml-1 h-4 w-4" weight="regular" />
        </Button>
      )}
    </div>
  );
}

export function SearchModalColors() {
  const t = useTranslations('search');
  const { groupedByColor, handleColorClick } = useSearchModal();
  if (groupedByColor.size === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        {t('colors')} ({groupedByColor.size})
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from(groupedByColor.entries())
          .slice(0, 4)
          .map(([color, data]) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorClick(color)}
              className="flex touch-manipulation items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
            >
              <div
                className="h-8 w-8 flex-shrink-0 rounded-md border-2 shadow-sm"
                style={data.hex ? parseStyles(data.hex) : { backgroundColor: '#e5e7eb' }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{color}</div>
                <div className="text-xs text-muted-foreground">
                  {data.unis.length} {t('overallCount')}
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

export function SearchModalSchools() {
  const t = useTranslations('search');
  const { groupedByInstitution, handleInstitutionClick } = useSearchModal();
  if (groupedByInstitution.size === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        {t('schools')} ({groupedByInstitution.size})
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from(groupedByInstitution.entries())
          .slice(0, 4)
          .map(([institution, unis]) => (
            <button
              key={institution}
              type="button"
              onClick={() => handleInstitutionClick(institution)}
              className="flex touch-manipulation items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{institution}</div>
                <div className="text-xs text-muted-foreground">
                  {unis.length} {t('overallCount')}
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

export function SearchModalResults() {
  const t = useTranslations('search');
  const { results, isSearching, searchQuery } = useSearchModal();

  if (
    !(
      results.length > 0 ||
      isSearching ||
      (searchQuery.trim().length >= 3 && results.length === 0)
    )
  ) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain p-4 transition-opacity duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <CircleNotch className="h-6 w-6 text-green motion-safe:animate-spin" weight="regular" />
        </div>
      )}

      {!isSearching && searchQuery.trim().length >= 3 && results.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('noResults')} &quot;{searchQuery}&quot;
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-6">
          <SearchModal.Overalls />
          <SearchModal.Colors />
          <SearchModal.Schools />
        </div>
      )}
    </div>
  );
}

export const SearchModal = Object.assign(SearchModalRoot, {
  Trigger: SearchModalTrigger,
  Content: SearchModalContent,
  Input: SearchModalInput,
  Results: SearchModalResults,
  Overalls: SearchModalOveralls,
  Colors: SearchModalColors,
  Schools: SearchModalSchools,
});

export function SearchModalDefault({
  triggerLabel,
  placeholder,
  modalTitle,
  clientSearchContext,
}: {
  triggerLabel: string;
  placeholder: string;
  modalTitle: string;
  clientSearchContext?: ClientSearchContext;
}) {
  return (
    <SearchModal
      placeholder={placeholder}
      modalTitle={modalTitle}
      clientSearchContext={clientSearchContext}
    >
      <SearchModal.Trigger>{triggerLabel}</SearchModal.Trigger>
      <SearchModal.Content />
    </SearchModal>
  );
}
