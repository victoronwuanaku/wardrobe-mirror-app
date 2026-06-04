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
  // Multi-select item: per axis, take the selected option with the max |direction| (sign-aware).
  multi?: boolean;
  // Optional resolver converting a raw answer (e.g. a number) to a lookup key for `directions`.
  bucket?: (raw: string) => string;
  // answer/bucket key -> signed direction per axis, s in [-1, +1].
  directions: Record<string, Partial<Record<Axis, number>>>;
}
