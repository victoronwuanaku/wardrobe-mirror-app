const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Normalize an axis from accumulated signed evidence to a 0-100 score where 50 = neutral.
 * score = 50 + 50 * (num / den); den === 0 means "no evidence" -> 50.
 */
export function normalizeAxis(num: number, den: number): number {
  if (den === 0) return 50;
  return clamp(Math.round(50 + 50 * (num / den)));
}
