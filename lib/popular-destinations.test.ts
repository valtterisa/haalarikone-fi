import { describe, expect, it } from 'vitest';
import {
  joinNames,
  pinPopularFirst,
  POPULAR_AREAS,
  POPULAR_SCHOOLS,
  splitCsv,
} from './popular-destinations';

describe('pinPopularFirst', () => {
  it('puts the analytics cities first and keeps the rest in original order', () => {
    const items = ['Espoo', 'Helsinki', 'Jyväskylä', 'Oulu', 'Tampere', 'Turku', 'Vaasa'];
    expect(pinPopularFirst(items, POPULAR_AREAS, 'fi', 'area')).toEqual([
      'Turku',
      'Oulu',
      'Jyväskylä',
      'Tampere',
      'Espoo',
      'Helsinki',
      'Vaasa',
    ]);
  });

  it('matches Swedish city names from the Finnish popular list', () => {
    const items = ['Esbo', 'Helsingfors', 'Åbo', 'Tammerfors'];
    expect(pinPopularFirst(items, POPULAR_AREAS, 'sv', 'area')).toEqual([
      'Åbo',
      'Tammerfors',
      'Esbo',
      'Helsingfors',
    ]);
  });

  it('pins popular schools using English names from translations.json', () => {
    const items = [
      'Aalto University',
      'Metropolia University of Applied Sciences',
      'Tampere University',
      'Turku University of Applied Sciences',
    ];
    expect(pinPopularFirst(items, POPULAR_SCHOOLS, 'en', 'university')).toEqual([
      'Tampere University',
      'Metropolia University of Applied Sciences',
      'Turku University of Applied Sciences',
      'Aalto University',
    ]);
  });
});

describe('splitCsv', () => {
  it('splits and trims unique parts', () => {
    expect(splitCsv('Turku, Tampere, Turku')).toEqual(['Turku', 'Tampere']);
  });
});

describe('joinNames', () => {
  it('limits the joined list', () => {
    expect(joinNames(['a', 'b', 'c'], 2)).toBe('a, b');
  });
});
