import type { ValueMeters } from '../types';

// The four value axes are exactly the keys of ValueMeters (storage keys unchanged).
// `inflowOutflow` is the storage key; it represents "Circularity consciousness" in the UI.
export type Axis = keyof ValueMeters; // 'social' | 'emotional' | 'functional' | 'inflowOutflow'

export const ALL_AXES: Axis[] = ['functional', 'social', 'emotional', 'inflowOutflow'];

// Salience tiers (how much an item counts as evidence on an axis).
export const W = { strong: 3, moderate: 2, mild: 1 } as const;

export interface ItemSpec {
  // Salience (weight) per axis this item bears on.
  salience: Partial<Record<Axis, number>>;
  // Axes that are PRIMARY probes: counted in the denominator even when the answer is neutral (s = 0).
  primary: Axis[];
  // Multi-select item: per axis, among selected options pick the one with the largest |direction|
  // and use its signed value; equal-magnitude ties resolve by directions-table order (selection order is ignored).
  multi?: boolean;
  // Optional resolver converting a raw answer (e.g. a number) to a lookup key for `directions`.
  bucket?: (raw: string) => string;
  // answer/bucket key -> signed direction per axis, s in [-1, +1].
  directions: Record<string, Partial<Record<Axis, number>>>;
}

export function costBand(raw: string): string {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return '21-75'; // neutral band; non-numeric is filtered before scoring
  if (n <= 20) return '0-20';
  if (n <= 75) return '21-75';
  if (n <= 150) return '76-150';
  return '151+';
}

export function yearsBand(raw: string): string {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return '0-1';
  if (n <= 1) return '0-1';
  if (n <= 3) return '2-3';
  if (n <= 6) return '4-6';
  if (n <= 10) return '7-10';
  return '11+';
}

// Behavioural items -> Reflected profile (spec §4.1).
export const BEHAVIOUR_SPECS: Record<string, ItemSpec> = {
  howGot: {
    salience: { inflowOutflow: W.moderate, emotional: W.moderate, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'bought-new': { inflowOutflow: -1 },
      'bought-secondhand': { functional: 0.5, inflowOutflow: 1 },
      'gift': { emotional: 1 },
      'borrowed-shared-rented': { inflowOutflow: 1 },
      'made-it': { functional: 0.5, emotional: 0.5, inflowOutflow: 1 },
    },
  },
  cost: {
    // 2026-06-11 recalibration: price is not attachment evidence — emotional loading removed.
    salience: { functional: W.moderate, inflowOutflow: W.mild },
    primary: ['functional'],
    bucket: costBand,
    directions: {
      '0-20': { functional: -0.5, inflowOutflow: -0.3 },
      '21-75': {},
      '76-150': { functional: 0.5 },
      '151+': { functional: 1 },
    },
  },
  wearFrequency: {
    salience: { functional: W.moderate, inflowOutflow: W.mild },
    primary: ['functional'],
    directions: {
      'once-a-week': { functional: 1, inflowOutflow: 0.5 },
      'once-a-month': { functional: 0.5, inflowOutflow: 0.3 },
      'once-each-season': {},
      'not-used-last-year': { functional: -1, inflowOutflow: -0.5 },
    },
  },
  mainUse: {
    // 2026-06-11 recalibration: leisure wear is not group/image signalling (Sheth social value)
    // and purely utilitarian contexts argue mildly AGAINST social motivation (ipsative, like primaryDriver).
    salience: { functional: W.moderate, social: W.moderate, inflowOutflow: W.mild },
    primary: ['functional', 'social'],
    multi: true,
    directions: {
      'work': { functional: 1, social: -0.3 },
      'home': { functional: 1, social: -0.3 },
      'sport': { functional: 1, social: -0.3 },
      'special-occasions': { social: 1 },
      'leisure': {},
      'not-in-use': { functional: -1, inflowOutflow: -1 },
      'other': {},
    },
  },
  whyBought: {
    salience: { social: W.moderate, inflowOutflow: W.moderate, functional: W.mild },
    primary: ['social', 'inflowOutflow'],
    directions: {
      // 2026-06-11 recalibration: replacement purchase is need-driven, not image-driven (mild anti-social signal).
      'replace-similar': { functional: 1, social: -0.3, inflowOutflow: 0.3 },
      'wanted-new': { social: 1, inflowOutflow: -1 },
      'on-sale': { inflowOutflow: -0.6 },
      'other': {},
    },
  },
  whyFavorite: {
    salience: { functional: W.moderate, social: W.moderate, emotional: W.moderate },
    primary: ['functional', 'social', 'emotional'],
    multi: true,
    directions: {
      // 2026-06-11 recalibration: comfort chosen over the style/confidence options is a mild anti-social signal.
      'comfortable': { functional: 1, social: -0.3 },
      'easy-to-style': { functional: 0.3, social: 0.5 },
      'confident': { social: 1 },
      'personal-emotional': { emotional: 1 },
      'other': {},
    },
  },
  howLongHadCategorical: {
    salience: { emotional: W.moderate, inflowOutflow: W.mild },
    primary: ['emotional'],
    directions: {
      'less-1-year': {},
      '1-2-years': { emotional: 0.3 },
      '3-4-years': { emotional: 0.5, inflowOutflow: 0.3 },
      '5-6-years': { emotional: 0.7, inflowOutflow: 0.5 },
      '7-plus-years': { emotional: 1, inflowOutflow: 0.7 },
    },
  },
  howLongHadYears: {
    salience: { emotional: W.moderate, inflowOutflow: W.mild },
    primary: ['emotional'],
    bucket: yearsBand,
    directions: {
      '0-1': {},
      '2-3': { emotional: 0.3 },
      '4-6': { emotional: 0.5, inflowOutflow: 0.3 },
      '7-10': { emotional: 0.7, inflowOutflow: 0.5 },
      '11+': { emotional: 1, inflowOutflow: 0.7 },
    },
  },
  washFrequency: {
    salience: { functional: W.mild, inflowOutflow: W.mild },
    primary: ['functional'],
    directions: {
      'every-time': { functional: 0.5, inflowOutflow: 0.3 },
      'few-times': { functional: 1, inflowOutflow: 0.5 },
      'when-dirty': { functional: 0.5, inflowOutflow: 0.3 },
      'never': {},
    },
  },
  repaired: {
    salience: { inflowOutflow: W.moderate, functional: W.mild, emotional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'yes-myself': { functional: 0.6, emotional: 0.5, inflowOutflow: 1 },
      'yes-professionally': { functional: 0.6, inflowOutflow: 1 },
      'no-but-would': { inflowOutflow: 0.4 },
      'no': {},
    },
  },
  whyNotWear: {
    salience: { functional: W.moderate, social: W.moderate, inflowOutflow: W.mild, emotional: W.mild },
    primary: ['functional', 'social'],
    multi: true,
    directions: {
      'doesnt-fit': { functional: 1 },
      'damaged-worn-out': { functional: 0.5 },
      'out-of-style': { social: 1, inflowOutflow: -0.5 },
      // 2026-06-11 recalibration: taste change is not necessarily a style/image signal (out-of-style keeps +1).
      'dont-like-anymore': { social: 0.5, inflowOutflow: -0.5 },
      'waiting-occasion': { social: 0.3, emotional: 0.5 },
      'forgot': { inflowOutflow: -1 },
      'other': {},
    },
  },
  disposalPlan: {
    salience: { inflowOutflow: W.strong, emotional: W.mild, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'repair-repurpose': { functional: 0.5, emotional: 0.5, inflowOutflow: 1 },
      'gift-friends-family': { emotional: 0.5, inflowOutflow: 0.8 },
      // 2026-06-11 recalibration: routine charity donation is not attachment evidence (emotional loading removed).
      'donate-charity': { inflowOutflow: 0.8 },
      'sell-it': { inflowOutflow: 0.7 },
      'textile-bins': { inflowOutflow: 0.5 },
    },
  },
};

// Baseline items -> Expectation profile (spec §4.2). primaryDriver is the one ipsative item.
export const BASELINE_SPECS: Record<string, ItemSpec> = {
  primaryDriver: {
    salience: { functional: W.moderate, social: W.moderate, emotional: W.moderate },
    primary: [],
    directions: {
      'function': { functional: 1, social: -0.5, emotional: -0.5 },
      'emotion': { emotional: 1, functional: -0.5, social: -0.5 },
      'social': { social: 1, functional: -0.5, emotional: -0.5 },
    },
  },
  wardrobeSize: {
    salience: { inflowOutflow: W.moderate, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'minimal': { functional: 0.5, inflowOutflow: 1 },
      'moderate': {},
      'extensive': { inflowOutflow: -1 },
    },
  },
  shoppingFrequency: {
    salience: { inflowOutflow: W.moderate, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'rarely': { functional: 0.3, inflowOutflow: 1 },
      'occasionally': {},
      'frequently': { inflowOutflow: -1 },
    },
  },
  disposalHabit: {
    salience: { inflowOutflow: W.moderate, emotional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'rarely': { emotional: 0.5, inflowOutflow: -0.3 },
      'periodically': {},
      'regularly': { inflowOutflow: 0.5 },
    },
  },
};

export type ArchetypeKey =
  | 'functionalMinimalist'
  | 'socialChameleon'
  | 'memoryKeeper'
  | 'identityCollector'
  | 'consciousCurator'
  | 'balancedAdapter';

// Prototype coordinates in [functional, social, emotional, inflowOutflow] space.
// 2026-06-11 recalibration: anchored to the observed score distribution of the 76 clean
// pilot sessions (defining axis ~85th percentile, contrast axes ~15th, otherwise median;
// Balanced Adapter = observed centroid). Replaces the uncalibrated v1 coordinates, four of
// which sat outside the reachable score space and starved three personas entirely.
export const PROTOTYPES: Record<ArchetypeKey, ValueMeters> = {
  functionalMinimalist: { functional: 78, social: 59, emotional: 58, inflowOutflow: 46 },
  socialChameleon:      { functional: 68, social: 90, emotional: 65, inflowOutflow: 39 },
  memoryKeeper:         { functional: 58, social: 59, emotional: 81, inflowOutflow: 46 },
  identityCollector:    { functional: 58, social: 90, emotional: 81, inflowOutflow: 46 },
  consciousCurator:     { functional: 68, social: 59, emotional: 65, inflowOutflow: 58 },
  balancedAdapter:      { functional: 68, social: 74, emotional: 65, inflowOutflow: 46 },
};

// A genuinely flat profile (max - min below this spread) resolves to Balanced Adapter.
// 2026-06-11 recalibration: 12 -> 8. With prototypes anchored to the observed distribution,
// a distinctive profile can have small absolute spread (circularity's observed range sits
// below the other axes), so the old threshold mis-gated the Conscious Curator region.
// 8 still routes a no-evidence [50,50,50,50] profile to Balanced Adapter.
export const FLAT_PROFILE_SPREAD = 8;
