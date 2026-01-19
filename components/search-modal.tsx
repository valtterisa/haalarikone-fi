"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X, Loader2, ChevronRight } from "lucide-react";
import { searchUniversitiesAPI } from "@/lib/search-utils";
import { parseStyles } from "@/lib/utils";
import { generateSlug } from "@/lib/generate-slug";
import type { University } from "@/types/university";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getSlugForEntity } from '@/lib/slug-translations';
import { useLocale } from 'next-intl';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';

interface SearchModalProps {
    triggerLabel: string;
    placeholder: string;
    modalTitle: string;
}

export function SearchModal({
    triggerLabel,
    placeholder,
    modalTitle,
}: SearchModalProps) {
    const t = useTranslations('search');
    const tCommon = useTranslations('common');
    const tOverall = useTranslations('overall');
    const locale = useLocale() as 'fi' | 'en' | 'sv';
    const routes = useTranslatedRoutes();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<University[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showAllHaalarit, setShowAllHaalarit] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!open) {
            setSearchQuery("");
            setResults([]);
            setShowAllHaalarit(false);
        }
    }, [open]);

    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setResults([]);
            return;
        }

        setShowAllHaalarit(false);
        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchResults = await searchUniversitiesAPI(searchQuery.trim(), locale);
                setResults(searchResults);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelect = (uni: University) => {
        router.push(routes.overall(String(uni.id)));
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

    const groupedByColor = useMemo(() => {
        const groups = new Map<string, { unis: University[]; hex: string | null }>();
        results.forEach((uni) => {
            if (!groups.has(uni.vari)) {
                groups.set(uni.vari, { unis: [], hex: null });
            }
            const group = groups.get(uni.vari)!;
            group.unis.push(uni);
            if (!group.hex && uni.hex) {
                group.hex = uni.hex;
            }
        });
        return groups;
    }, [results]);

    const groupedByInstitution = useMemo(() => {
        const groups = new Map<string, University[]>();
        results.forEach((uni) => {
            if (!groups.has(uni.oppilaitos)) {
                groups.set(uni.oppilaitos, []);
            }
            groups.get(uni.oppilaitos)!.push(uni);
        });
        return groups;
    }, [results]);

    const visibleHaalaritCount = showAllHaalarit ? results.length : 5;

    return (
        <div className="p-2">
            <Button
                onClick={() => setOpen(true)}
                variant="outline"
                className="w-full sm:w-auto gap-2"
            >
                <SearchIcon className="h-4 w-4" />
                {triggerLabel}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={`max-w-2xl overflow-hidden flex flex-col p-0 rounded-2xl transition-all duration-300 ${results.length > 0 || isSearching ? 'h-[600px]' : 'h-auto'
                        }`}
                    hideCloseButton
                >
                    <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
                    <div className="px-3 pt-4 pb-3 sm:px-6 sm:pt-8 sm:pb-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-6 sm:h-6 pointer-events-none z-10" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={placeholder}
                                    className="pl-10 pr-24 sm:pl-16 sm:pr-28 h-12 sm:h-16 text-base sm:text-lg bg-white dark:bg-background text-foreground border-input focus:ring-2 focus:ring-green/30 focus-visible:ring-2 focus-visible:ring-green/30 border-2 shadow-sm hover:shadow-md transition-shadow"
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-10">
                                        <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {searchQuery && !isSearching && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1 sm:p-2 rounded hover:bg-muted z-10"
                                        aria-label={t('clearSearch')}
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-sm text-muted-foreground hover:text-foreground transition px-2 py-1 rounded hover:bg-muted flex-shrink-0"
                            >
                                {tCommon('close')}
                            </button>
                        </div>
                    </div>

                    {(results.length > 0 || isSearching || (searchQuery.trim().length >= 2 && results.length === 0)) && (
                        <div className="flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                            {isSearching && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-green" />
                                </div>
                            )}

                            {!isSearching && searchQuery.trim().length >= 2 && results.length === 0 && (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    {t('noResults')} "{searchQuery}"
                                </div>
                            )}

                            {!isSearching && results.length > 0 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                            {t('overalls')} ({results.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {results.slice(0, visibleHaalaritCount).map((uni) => (
                                                <button
                                                    key={uni.id}
                                                    onClick={() => handleSelect(uni)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition text-left"
                                                >
                                                    <div
                                                        className="w-10 h-10 rounded-md border-2 shadow-sm flex-shrink-0"
                                                        style={uni.hex ? parseStyles(uni.hex) : { backgroundColor: '#e5e7eb' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm">
                                                            {uni.ainejärjestö || uni.ala || tOverall('unknownOrganization')}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {uni.oppilaitos} • {uni.vari}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                        {results.length > 5 && !showAllHaalarit && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => setShowAllHaalarit(true)}
                                                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                {t('showAll')} {results.length} {t('overallCount')}
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        )}
                                    </div>

                                    {groupedByColor.size > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                {t('colors')} ({groupedByColor.size})
                                            </h3>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {Array.from(groupedByColor.entries())
                                                    .slice(0, 4)
                                                    .map(([color, data]) => (
                                                        <button
                                                            key={color}
                                                            onClick={() => handleColorClick(color)}
                                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition text-left"
                                                        >
                                                            <div
                                                                className="w-8 h-8 rounded-md border-2 shadow-sm flex-shrink-0"
                                                                style={data.hex ? parseStyles(data.hex) : { backgroundColor: '#e5e7eb' }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{color}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {data.unis.length} {t('overallCount')}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {groupedByInstitution.size > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                {t('schools')} ({groupedByInstitution.size})
                                            </h3>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {Array.from(groupedByInstitution.entries())
                                                    .slice(0, 4)
                                                    .map(([institution, unis]) => (
                                                        <button
                                                            key={institution}
                                                            onClick={() => handleInstitutionClick(institution)}
                                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition text-left"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{institution}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {unis.length} {t('overallCount')}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
