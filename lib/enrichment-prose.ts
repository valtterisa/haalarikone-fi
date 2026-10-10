export function splitProseParagraphs(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences = [...new Intl.Segmenter('fi', { granularity: 'sentence' }).segment(cleaned)]
    .map((part) => part.segment.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [cleaned];
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(
      sentences
        .slice(i, i + 2)
        .map((sentence) => sentence.trim())
        .join(' '),
    );
  }
  return paragraphs;
}
