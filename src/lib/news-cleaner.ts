/**
 * Universal editorial content cleaner that purges related story headline links,
 * widget link farms, repetitive wire titles, and web boilerplate.
 * Pure TypeScript utility safe for both browser client components and server environments.
 */
export function cleanStoryText(rawContent: string): string {
  if (!rawContent) return '';

  const paragraphs = rawContent.split(/\n\n+/);
  const cleanedParagraphs: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    // Check if it's a wire header link (e.g. "### MOTOAMERICA: ...", "MOTOAMERICA: RESULTS FROM...")
    const plainText = p.replace(/^[#\s>]+/, '').trim();
    const isUppercaseHeadline = plainText.length > 15 && plainText.length < 120 && plainText === plainText.toUpperCase();
    const isWirePrefixedHeadline = /^(motoamerica|racer|jayski|speedcafe|imsa|dirt track digest|dragzine|traxion|world of outlaws|scca|nascar|f1|indycar):\s+[A-Z0-9\s\(\)\-\'\"]+$/i.test(plainText);

    // If it's an uppercase wire headline and looks like a linked related story, filter it out
    if (isUppercaseHeadline || isWirePrefixedHeadline) {
      continue;
    }

    // Filter out standard junk boilerplate
    if (
      /preferred sources|google news|trusted source|follow us on|subscribe to|newsletter|appeared first on|all rights reserved|cookie policy|terms of use|terms of service|photo by|image credit|read more|advertisement|sign up|join our discord|minute read|published on|written by/i.test(plainText) ||
      /^\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(plainText) ||
      /^by\s+[a-z\s\.\-]+$/i.test(plainText)
    ) {
      continue;
    }

    cleanedParagraphs.push(p);
  }

  return cleanedParagraphs.join('\n\n');
}
