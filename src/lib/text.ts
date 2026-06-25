/** Turn a slug like "the-roman-empire" into "The Roman Empire". */
export function humanize(slug: string): string {
  const small = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'for']);
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word, i) => {
      if (i > 0 && small.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Pull the first numeric value out of a year/period label ("1600s" -> 1600). */
export function yearValue(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/** Deterministically shuffle using a seed so re-renders are stable. */
export function seededShuffle<T>(input: T[], seed: number): T[] {
  const arr = [...input];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
