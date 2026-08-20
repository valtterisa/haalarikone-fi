'use client';

import SearchContainer from '@/components/search-container';
import { SearchDivider } from '@/components/search-filter-parts';
import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import type { ReactNode } from 'react';

type HubSearchSectionProps = {
  universities: University[];
  colorData: ColorData;
  divider: ReactNode;
  previewCount?: number;
};

function HubSearchSectionRoot({
  universities,
  colorData,
  divider,
  previewCount = 5,
}: HubSearchSectionProps) {
  return (
    <>
      <SearchContainer initialUniversities={universities} colorData={colorData}>
        <SearchContainer.Form />
        <SearchContainer.Results previewCount={previewCount} />
      </SearchContainer>
      <SearchDivider>{divider}</SearchDivider>
    </>
  );
}

export const HubSearchSection = Object.assign(HubSearchSectionRoot, {
  Divider: SearchDivider,
});

export default HubSearchSection;
