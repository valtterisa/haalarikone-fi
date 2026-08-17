import { track } from '@databuddy/sdk';

export type HubType = 'area' | 'university' | 'field' | 'color';

export type HubSource =
  | 'home'
  | 'area'
  | 'area-index'
  | 'university'
  | 'university-index'
  | 'field'
  | 'color'
  | 'search'
  | 'header'
  | 'footer';

export function trackHubClick(source: HubSource, type: HubType, slug: string) {
  track('hub_click', { source, type, slug });
}

export function trackFilterSelect(
  filter: 'area' | 'school' | 'field' | 'color',
  value: string,
) {
  track('filter_select', { filter, value });
}

export function trackSearchApply(payload: {
  has_query: boolean;
  has_filters: boolean;
  result_count: number;
}) {
  track('search_apply', payload);
}

export function trackResultClick(slug: string, source: HubSource) {
  track('result_click', { slug, source });
}
