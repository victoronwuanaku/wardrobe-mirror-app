import type { ValueMeters } from '../types';
import { type ItemSpec, type Axis } from './scoring-config';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Normalize an axis from accumulated signed evidence to a 0-100 score where 50 = neutral.
 * score = 50 + 50 * (num / den); den === 0 means "no evidence" -> 50.
 * Precondition: den >= 0 (it is a sum of non-negative saliences). A negative den would invert the score.
 */
export function normalizeAxis(num: number, den: number): number {
  if (den === 0) return 50;
  return clamp(Math.round(50 + 50 * (num / den)));
}

export interface ScoredProfile {
  values: ValueMeters;
  evidence: Record<Axis, number>; // denominator (evidence mass) per axis
}

type Answer = string | string[];

function directionFor(spec: ItemSpec, axis: Axis, answer: Answer): number {
  if (spec.multi) {
    const selected = Array.isArray(answer) ? answer : [answer];
    let s = 0;
    for (const key of selected) {
      const d = spec.directions[key]?.[axis] ?? 0;
      if (Math.abs(d) > Math.abs(s)) s = d; // max magnitude, first wins on tie
    }
    return s;
  }
  const key = spec.bucket ? spec.bucket(String(answer)) : String(answer);
  return spec.directions[key]?.[axis] ?? 0;
}

/**
 * Accumulate signed evidence across (spec, answer) pairs and normalize each axis.
 * An axis is counted in the denominator when the item is a PRIMARY probe of it,
 * or when the chosen answer has a non-zero direction on it.
 */
export function scoreProfile(items: Array<[ItemSpec, Answer]>): ScoredProfile {
  const num: Record<Axis, number> = { functional: 0, social: 0, emotional: 0, inflowOutflow: 0 };
  const den: Record<Axis, number> = { functional: 0, social: 0, emotional: 0, inflowOutflow: 0 };

  for (const [spec, answer] of items) {
    for (const axis of Object.keys(spec.salience) as Axis[]) {
      const w = spec.salience[axis]!;
      const s = directionFor(spec, axis, answer);
      const isPrimary = spec.primary.includes(axis);
      if (isPrimary || s !== 0) {
        num[axis] += w * s;
        den[axis] += w;
      }
    }
  }

  const values: ValueMeters = {
    functional: normalizeAxis(num.functional, den.functional),
    social: normalizeAxis(num.social, den.social),
    emotional: normalizeAxis(num.emotional, den.emotional),
    inflowOutflow: normalizeAxis(num.inflowOutflow, den.inflowOutflow),
  };
  return { values, evidence: den };
}
