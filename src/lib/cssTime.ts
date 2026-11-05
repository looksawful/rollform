/** Convert CSS time values to the seconds expected by GSAP. */
export function cssTimeSeconds(raw: string, fallback: number): number {
  const value = parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const text = raw.trim();
  if (text.endsWith('ms')) return value / 1000;
  if (text.endsWith('s')) return value;
  return fallback;
}
