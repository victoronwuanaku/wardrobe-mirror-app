export interface Delta {
  sign: 'up' | 'down' | 'flat';
  label: string;
  magnitude: number;
}

/** Signed delta between a reflected value and an expectation value, for the baseline-comparison row. */
export function formatDelta(reflected: number, expectation: number): Delta {
  const diff = reflected - expectation;
  if (diff > 0) return { sign: 'up', label: `+${diff}`, magnitude: diff };
  if (diff < 0) return { sign: 'down', label: `${diff}`, magnitude: -diff };
  return { sign: 'flat', label: '0', magnitude: 0 };
}
