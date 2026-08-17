import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchForm from './search-form';
import type { Criteria } from './search-container';
import type { ColorData } from '@/lib/load-color-data';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fi',
}));

vi.mock('@databuddy/sdk', () => ({
  track: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    // Simplify motion.div to a plain div for testing
    div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  },
}));

const baseCriteria: Criteria = {
  textSearch: '',
  color: '',
  area: '',
  field: '',
  school: '',
};

const colorData: ColorData = {
  colors: {
    vihrea: {
      color: '#00ff00',
      main: ['vihreä'],
      shades: [],
    },
  },
};

describe('SearchForm', () => {
  it('calls onTextSearchChange when the user types in the search box', async () => {
    const onTextSearchChange = vi.fn();

    render(
      <SearchForm
        onTextSearchChange={onTextSearchChange}
        onDraftAdvancedFilterChange={vi.fn()}
        onApplyAdvancedFilters={vi.fn()}
        onClearAll={vi.fn()}
        areas={[]}
        fields={[]}
        schools={[]}
        selectedCriteria={baseCriteria}
        draftAdvancedFilters={{ color: '', area: '', field: '', school: '' }}
        resultCount={0}
        draftFilterResultCount={0}
        hasSearched={false}
        isSearching={false}
        colorData={colorData}
      />,
    );

    const input = screen.getByRole('textbox');
    const user = userEvent.setup();

    await user.type(input, 'Helsinki');

    expect(onTextSearchChange).toHaveBeenCalled();
    expect(onTextSearchChange).toHaveBeenLastCalledWith('Helsinki');
  });

  it('renders and triggers the advanced filters apply button when there are draft changes', async () => {
    const onApplyAdvancedFilters = vi.fn();
    const selectedCriteria: Criteria = {
      textSearch: '',
      color: 'vihreä',
      area: 'Helsinki',
      field: 'fysiikka',
      school: 'Helsingin yliopisto',
    };

    render(
      <SearchForm
        onTextSearchChange={vi.fn()}
        onDraftAdvancedFilterChange={vi.fn()}
        onApplyAdvancedFilters={onApplyAdvancedFilters}
        onClearAll={vi.fn()}
        areas={['Helsinki']}
        fields={['fysiikka']}
        schools={['Helsingin yliopisto']}
        selectedCriteria={selectedCriteria}
        draftAdvancedFilters={{
          color: 'musta',
          area: 'Helsinki',
          field: 'fysiikka',
          school: 'Helsingin yliopisto',
        }}
        resultCount={10}
        draftFilterResultCount={3}
        hasSearched
        isSearching={false}
        colorData={colorData}
      />,
    );

    const filtersToggle = screen.getByRole('button', { name: /filters\s*\(4\)/ });
    await userEvent.click(filtersToggle);

    const applyButton = await screen.findByRole('button', {
      name: 'filter (3)',
    });

    await userEvent.click(applyButton);

    expect(onApplyAdvancedFilters).toHaveBeenCalledTimes(1);
  });
});
