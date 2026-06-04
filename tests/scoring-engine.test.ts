import { describe, it, expect } from 'vitest';
import { normalizeAxis } from '../src/app/components/mirror/lib/scoring-engine';

describe('normalizeAxis', () => {
  it('returns neutral 50 when there is no evidence (den = 0)', () => {
    expect(normalizeAxis(0, 0)).toBe(50);
  });
  it('returns 100 when all evidence is maximally positive', () => {
    expect(normalizeAxis(2, 2)).toBe(100);
  });
  it('returns 0 when all evidence is maximally negative', () => {
    expect(normalizeAxis(-2, 2)).toBe(0);
  });
  it('maps a half-positive mean to 75', () => {
    expect(normalizeAxis(1, 2)).toBe(75);
  });
  it('rounds to the nearest integer', () => {
    expect(normalizeAxis(-1, 4)).toBe(38); // 50 + 50*(-0.25) = 37.5 -> 38
  });
  it('clamps out-of-range means to [0,100]', () => {
    expect(normalizeAxis(3, 2)).toBe(100);
    expect(normalizeAxis(-3, 2)).toBe(0);
  });
});
