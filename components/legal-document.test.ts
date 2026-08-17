import { describe, expect, it } from 'vitest';
import { parseLegalSections } from './legal-document';

describe('parseLegalSections', () => {
  it('keeps valid sections with and without items', () => {
    expect(
      parseLegalSections([
        { title: 'A', paragraphs: ['one'] },
        {
          title: 'B',
          paragraphs: ['two'],
          items: [{ name: 'Cookie', detail: 'Used for login.' }],
        },
      ]),
    ).toEqual([
      { title: 'A', paragraphs: ['one'] },
      {
        title: 'B',
        paragraphs: ['two'],
        items: [{ name: 'Cookie', detail: 'Used for login.' }],
      },
    ]);
  });

  it('rejects sections whose paragraphs are not all strings', () => {
    expect(
      parseLegalSections([{ title: 'A', paragraphs: ['ok', 1] }]),
    ).toEqual([]);
  });

  it('rejects sections whose items field is not an array', () => {
    expect(
      parseLegalSections([{ title: 'A', paragraphs: ['ok'], items: { name: 'x' } }]),
    ).toEqual([]);
  });

  it('rejects sections with malformed item values', () => {
    expect(
      parseLegalSections([
        { title: 'A', paragraphs: ['ok'], items: [{ name: 'Cookie', detail: 12 }] },
        { title: 'B', paragraphs: ['ok'], items: [{ name: 1, detail: 'Used' }] },
        { title: 'C', paragraphs: ['ok'], items: ['Cookie'] },
      ]),
    ).toEqual([]);
  });
});
