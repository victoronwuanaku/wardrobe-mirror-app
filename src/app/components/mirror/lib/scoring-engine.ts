import type { ValueMeters, SetResponse, BaselineResponses } from '../types';
import { type ItemSpec, type Axis, BEHAVIOUR_SPECS, BASELINE_SPECS } from './scoring-config';

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

// Caller contract: multi specs receive array answers; non-multi specs receive scalar answers.
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

// [response field, spec key] per set. Order is irrelevant to the score.
const REFLECTED_FIELDS: Record<'A' | 'B' | 'C', Array<[string, string]>> = {
  A: [['howGot', 'howGot'], ['cost', 'cost'], ['wearFrequency', 'wearFrequency'], ['mainUse', 'mainUse'], ['whyBought', 'whyBought']],
  B: [['whyFavorite', 'whyFavorite'], ['howGot', 'howGot'], ['cost', 'cost'], ['howLongHad', 'howLongHadCategorical'], ['wearFrequency', 'wearFrequency'], ['mainUse', 'mainUse'], ['washFrequency', 'washFrequency'], ['repaired', 'repaired']],
  C: [['howLongHad', 'howLongHadYears'], ['cost', 'cost'], ['howGot', 'howGot'], ['whyNotWear', 'whyNotWear'], ['disposalPlan', 'disposalPlan']],
};

const SKIP_TOKENS = new Set(['', 'skipped', 'other-skipped']);

function isAnswered(value: unknown): value is string | string[] {
  if (value == null) return false;
  if (Array.isArray(value)) return value.filter((v) => !SKIP_TOKENS.has(v)).length > 0;
  if (typeof value === 'string') return !SKIP_TOKENS.has(value);
  return false;
}

export function scoreReflected(responses: SetResponse[]): ScoredProfile {
  const items: Array<[ItemSpec, Answer]> = [];
  for (const response of responses) {
    const fields = REFLECTED_FIELDS[response.setType];
    for (const [field, specKey] of fields) {
      const value = (response as unknown as Record<string, unknown>)[field];
      if (!isAnswered(value)) continue;
      if (specKey === 'cost' && Number.isNaN(parseInt(String(value), 10))) continue;
      items.push([BEHAVIOUR_SPECS[specKey], value]);
    }
  }
  return scoreProfile(items);
}

export function scoreExpectation(baseline: BaselineResponses | null | undefined): ScoredProfile {
  if (!baseline) return scoreProfile([]);
  const items: Array<[ItemSpec, Answer]> = [];
  for (const field of ['primaryDriver', 'wardrobeSize', 'shoppingFrequency', 'disposalHabit']) {
    const value = (baseline as unknown as Record<string, unknown>)[field];
    if (!isAnswered(value)) continue;
    items.push([BASELINE_SPECS[field], value]);
  }
  return scoreProfile(items);
}
