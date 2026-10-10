export function splitProseParagraphs(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences = cleaned.match(/[^.!?…]+[.!?…]+(?:["»)]+)?|[^.!?…]+$/g);
  if (!sentences || sentences.length <= 2) {
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
