import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultsDisplay from './result-display';
import type { University } from '@/types/university';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fi',
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span data-testid="mock-image" {...props} />
  ),
}));

vi.mock('@/components/university-card', () => ({
  __esModule: true,
  default: ({ uni }: { uni: University }) => <li>{uni.oppilaitos}</li>,
}));

const universities: University[] = [
  {
    id: 1,
    vari: 'Punainen',
    variLabel: 'Punainen',
    variBase: ['punainen'],
    hex: '#ff0000',
    alue: 'Helsinki',
    ala: 'fysiikka',
    ainejarjesto: 'Fyysikkokilta',
    slug: 'fyysikkokilta',
    oppilaitos: 'Helsingin yliopisto',
  },
  {
    id: 2,
    vari: 'Vihreä',
    variLabel: 'Vihreä',
    variBase: ['vihrea'],
    hex: '#00ff00',
    alue: 'Tampere',
    ala: 'insinööri',
    ainejarjesto: null,
    slug: 'u-2',
    oppilaitos: 'Tampereen yliopisto',
  },
];

describe('ResultsDisplay', () => {
  it('shows the empty state when there are no results', () => {
    render(<ResultsDisplay results={[]} />);

    expect(screen.getByText('noResultsMessageAlt')).toBeInTheDocument();
  });

  it('renders a list of results and pagination summary', () => {
    render(<ResultsDisplay results={universities} />);

    expect(screen.getByText('results')).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(screen.getByText('Helsingin yliopisto')).toBeInTheDocument();
    expect(screen.getByText('Tampereen yliopisto')).toBeInTheDocument();
  });
});
