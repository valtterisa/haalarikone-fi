'use client';

import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { FilterTabKey } from '@/lib/use-university-search';
import type { ReactNode } from 'react';

export type { FilterTabKey };

export type FilterTab = {
  key: FilterTabKey;
  label: string;
  hasValue: boolean;
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 focus-visible:ring-offset-2';

export function FilterTabs({
  tabs,
  active,
  onChange,
  className,
  tabClassName,
}: {
  tabs: FilterTab[];
  active: FilterTabKey;
  onChange: (key: FilterTabKey) => void;
  className?: string;
  tabClassName?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-1 overflow-x-auto border-b border-border/50', className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative w-fit flex-shrink-0 touch-manipulation px-4 py-2.5 text-sm font-medium transition-colors',
            focusRing,
            active === tab.key
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/70',
            tabClassName,
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            {tab.label}
            {tab.hasValue ? (
              <span className="h-1.5 w-1.5 rounded-full bg-green" aria-hidden="true" />
            ) : null}
          </span>
          {active === tab.key ? (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-green" aria-hidden="true" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function ColorSwatch({
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
      aria-pressed={isSelected}
      aria-label={displayName}
      className={cn(
        'group flex touch-manipulation flex-col items-center gap-1.5 rounded-lg p-2 transition-[background-color,transform] duration-150',
        focusRing,
        isSelected ? 'bg-muted/70' : 'hover:bg-muted/40',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-[border-color,transform,box-shadow] duration-150',
          isSelected
            ? 'scale-110 border-green ring-2 ring-green/30'
            : isWhite
              ? 'border-border'
              : 'border-transparent',
        )}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {isSelected ? (
          <CheckIcon
            aria-hidden="true"
            className={cn(
              'h-4 w-4',
              isWhite || color === '#FFFF00' || color === '#FFA500'
                ? 'text-foreground'
                : isBlack
                  ? 'text-white'
                  : 'text-white',
            )}
          />
        ) : null}
      </div>
      <span
        className={cn(
          'max-w-[50px] truncate text-center text-[10px] leading-tight',
          isSelected ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      >
        {displayName}
      </span>
    </button>
  );
}

export function ColorGridOption({
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

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={displayName}
      className={cn(
        'flex touch-manipulation flex-col items-center gap-2 rounded-xl p-3 shadow-sm transition-[background-color,box-shadow] duration-150',
        focusRing,
        isSelected ? 'bg-green/10 ring-2 ring-green' : 'bg-muted active:bg-muted/80',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full shadow-sm',
          isWhite ? 'border-2 border-border' : '',
        )}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {isSelected ? (
          <CheckIcon
            aria-hidden="true"
            className={cn(
              'h-5 w-5',
              isWhite || color === '#FFFF00' || color === '#FFA500'
                ? 'text-foreground'
                : 'text-white',
            )}
          />
        ) : null}
      </div>
      <span
        className={cn(
          'text-center text-xs leading-tight',
          isSelected ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      >
        {displayName}
      </span>
    </button>
  );
}

export function OptionList({
  options,
  selected,
  onSelect,
  variant = 'chip',
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  variant?: 'chip' | 'row';
}) {
  if (variant === 'row') {
    return (
      <div className="flex flex-col gap-2" role="listbox" aria-multiselectable={false}>
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(isSelected ? '' : option)}
              className={cn(
                'w-full touch-manipulation rounded-xl px-4 py-3 text-left text-sm shadow-sm transition-[background-color,color,box-shadow] duration-150',
                focusRing,
                isSelected
                  ? 'bg-green font-medium text-white shadow-md'
                  : 'bg-muted text-foreground active:bg-muted/80',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex max-h-64 flex-wrap gap-2 overflow-y-auto overscroll-contain scrollbar-none"
      role="listbox"
      aria-multiselectable={false}
    >
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(isSelected ? '' : option)}
            className={cn(
              'touch-manipulation rounded-lg px-3 py-1.5 text-sm shadow-sm transition-[background-color,color] duration-150',
              focusRing,
              isSelected
                ? 'bg-green text-white'
                : 'bg-muted text-foreground hover:bg-muted/80',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export type ActiveFilterItem = {
  key: FilterTabKey;
  value: string;
  display: string;
  color?: string | null;
};

export function ActiveFilterChips({
  filters,
  onRemove,
  onClear,
  clearLabel,
  variant = 'desktop',
}: {
  filters: ActiveFilterItem[];
  onRemove: (key: FilterTabKey) => void;
  onClear: () => void;
  clearLabel: string;
  variant?: 'mobile' | 'desktop';
}) {
  if (filters.length === 0) return null;

  const isMobile = variant === 'mobile';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        isMobile ? 'relative px-3 pb-3 sm:hidden' : 'mt-2 border-t border-border/30 pt-2',
      )}
    >
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(filter.key);
          }}
          aria-label={`${clearLabel}: ${filter.display}`}
          className={cn(
            'inline-flex touch-manipulation items-center gap-1.5 text-foreground transition-colors',
            focusRing,
            isMobile
              ? 'rounded-md bg-muted/60 px-2.5 py-1.5 text-sm active:bg-muted'
              : 'rounded bg-muted/50 px-2 py-1 text-xs hover:bg-muted',
          )}
        >
          {filter.key === 'color' && filter.color ? (
            <span
              className="h-2.5 w-2.5 rounded-full border border-border/50"
              style={{ backgroundColor: filter.color }}
              aria-hidden="true"
            />
          ) : null}
          <span aria-hidden="true">{filter.display}</span>
          <XIcon
            aria-hidden="true"
            className={cn('text-muted-foreground', isMobile ? 'h-3.5 w-3.5' : 'h-3 w-3')}
          />
        </button>
      ))}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className={cn(
          'touch-manipulation text-muted-foreground transition-colors',
          focusRing,
          isMobile
            ? 'rounded px-2.5 py-1.5 text-sm active:text-foreground'
            : 'ml-1 rounded text-xs underline underline-offset-2 hover:text-foreground',
        )}
      >
        {clearLabel}
      </button>
    </div>
  );
}

export function SearchDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-8 w-full">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{children}</span>
      </div>
    </div>
  );
}
