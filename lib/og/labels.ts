import type { Locale } from '@/lib/slug-translations';

type OgLabels = {
  brand: string;
  organizationEyebrow: string;
  universityEyebrow: string;
  colorCaption: string;
  overallSingular: string;
  overallPlural: string;
  colorSingular: string;
  colorPlural: string;
  unknownOrganization: string;
};

const LABELS: Record<Locale, OgLabels> = {
  fi: {
    brand: 'Haalarikone',
    organizationEyebrow: 'Opiskelijajärjestö',
    universityEyebrow: 'Oppilaitos',
    colorCaption: 'Haalariväri',
    overallSingular: 'haalari',
    overallPlural: 'haalaria',
    colorSingular: 'väri',
    colorPlural: 'väriä',
    unknownOrganization: 'Tuntematon järjestö',
  },
  en: {
    brand: 'Haalarikone',
    organizationEyebrow: 'Student organization',
    universityEyebrow: 'Institution',
    colorCaption: 'Overall color',
    overallSingular: 'overall',
    overallPlural: 'overalls',
    colorSingular: 'color',
    colorPlural: 'colors',
    unknownOrganization: 'Unknown organization',
  },
  sv: {
    brand: 'Haalarikone',
    organizationEyebrow: 'Studentorganisation',
    universityEyebrow: 'Lärosäte',
    colorCaption: 'Overallfärg',
    overallSingular: 'overall',
    overallPlural: 'overaller',
    colorSingular: 'färg',
    colorPlural: 'färger',
    unknownOrganization: 'Okänd organisation',
  },
};

export function getOgLabels(locale: Locale): OgLabels {
  return LABELS[locale] ?? LABELS.fi;
}

export function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
