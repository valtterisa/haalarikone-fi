export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[åäö]/g, (match) => {
      const replacements: Record<string, string> = {
        å: 'a',
        ä: 'a',
        ö: 'o',
      };
      return replacements[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
