import { describe, it, expect } from 'vitest';
import { normalizeAxis } from '../src/app/components/mirror/lib/scoring-engine';
import { BEHAVIOUR_SPECS, costBand, yearsBand } from '../src/app/components/mirror/lib/scoring-config';

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

describe('band resolvers', () => {
  it('buckets cost into the four bands', () => {
    expect(costBand('15')).toBe('0-20');
    expect(costBand('50')).toBe('21-75');
    expect(costBand('120')).toBe('76-150');
    expect(costBand('300')).toBe('151+');
  });
  it('buckets ownership years into the five bands', () => {
    expect(yearsBand('0')).toBe('0-1');
    expect(yearsBand('3')).toBe('2-3');
    expect(yearsBand('5')).toBe('4-6');
    expect(yearsBand('9')).toBe('7-10');
    expect(yearsBand('20')).toBe('11+');
  });
});

describe('behaviour specs shape', () => {
  it('declares a spec for every scorable behavioural field', () => {
    for (const key of [
      'howGot', 'cost', 'wearFrequency', 'mainUse', 'whyBought', 'whyFavorite',
      'howLongHadCategorical', 'howLongHadYears', 'washFrequency', 'repaired',
      'whyNotWear', 'disposalPlan',
    ]) {
      expect(BEHAVIOUR_SPECS[key]).toBeDefined();
    }
  });
  it('keeps every direction within [-1, 1]', () => {
    for (const spec of Object.values(BEHAVIOUR_SPECS)) {
      for (const dirs of Object.values(spec.directions)) {
        for (const v of Object.values(dirs)) {
          expect(v).toBeGreaterThanOrEqual(-1);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
