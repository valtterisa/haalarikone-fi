import { describe, expect, it } from 'vitest';
import { splitProseParagraphs } from '@/lib/enrichment-prose';

describe('splitProseParagraphs', () => {
  it('keeps short text as one paragraph', () => {
    expect(splitProseParagraphs('Yksi lause.')).toEqual(['Yksi lause.']);
  });

  it('groups longer text into readable paragraphs', () => {
    const text =
      'Prosessiteekkarit ry on vuonna 2012 perustettu kilta, joka syntyi Kemian tekniikan korkeakoulun kandidaattiuudistuksen myötä. Kilta ottaa vastaan Aalto-yliopiston Kemian tekniikan korkeakoulun kemian tekniikan kandidaattiohjelmissa aloittavat uudet opiskelijat ja perehdyttää heidät yliopistoelämään sekä Aalto-yhteisöön. Killan tarkoituksena on tuoda yhteen Kemian tekniikan korkeakoulun opiskelijoita.';

    expect(splitProseParagraphs(text)).toEqual([
      'Prosessiteekkarit ry on vuonna 2012 perustettu kilta, joka syntyi Kemian tekniikan korkeakoulun kandidaattiuudistuksen myötä. Kilta ottaa vastaan Aalto-yliopiston Kemian tekniikan korkeakoulun kemian tekniikan kandidaattiohjelmissa aloittavat uudet opiskelijat ja perehdyttää heidät yliopistoelämään sekä Aalto-yhteisöön.',
      'Killan tarkoituksena on tuoda yhteen Kemian tekniikan korkeakoulun opiskelijoita.',
    ]);
  });
});
