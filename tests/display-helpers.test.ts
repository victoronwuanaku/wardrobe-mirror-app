import { describe, it, expect } from 'vitest';
import { formatDelta } from '../src/app/components/mirror/lib/display-helpers';

describe('formatDelta', () => {
  it('formats a positive shift', () => {
    expect(formatDelta(70, 55)).toEqual({ sign: 'up', label: '+15', magnitude: 15 });
  });
  it('formats a negative shift', () => {
    expect(formatDelta(40, 60)).toEqual({ sign: 'down', label: '-20', magnitude: 20 });
  });
  it('formats no change', () => {
    expect(formatDelta(50, 50)).toEqual({ sign: 'flat', label: '0', magnitude: 0 });
  });
});
