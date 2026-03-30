import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchContainer from './search-container';
import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fi',
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  },
}));

vi.mock('@/components/university-card', () => ({
  __esModule: true,
  default: ({ uni }: { uni: University }) => <li>{uni.oppilaitos}</li>,
}));

vi.mock('@/lib/search-utils', () => ({
  searchUniversitiesAPI: vi.fn(async () => []),
}));

const universities: University[] = [
  {
    id: 1,
    vari: 'Punainen',
    hex: '#ff0000',
    alue: 'Helsinki',
    ala: 'fysiikka',
    ainejärjestö: 'Fyysikkokilta',
    oppilaitos: 'Helsingin yliopisto',
  },
  {
    id: 2,
    vari: 'Vihreä',
    hex: '#00ff00',
    alue: 'Tampere',
    ala: 'insinööri',
    ainejärjestö: null,
    oppilaitos: 'Tampereen yliopisto',
  },
];

const colorData: ColorData = {
  colors: {
    punainen: {
      color: '#ff0000',
      main: ['Punainen'],
      shades: [],
    },
    vihrea: {
      color: '#00ff00',
      main: ['Vihreä'],
      shades: [],
    },
  },
};

describe('SearchContainer', () => {
  it('renders initial overall results using the provided data', async () => {
    render(
      <SearchContainer
        initialUniversities={universities}
        colorData={colorData}
        showResultsByDefault
      />,
    );

    expect(await screen.findByText('results')).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });
});
