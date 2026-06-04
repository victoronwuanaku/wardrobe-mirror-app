import { describe, it, expect } from 'vitest';
import {
  calculateValuesFromMirrorGame,
  calculatePersona,
  calculateExpectationProfile,
  calculateReflectionConfidence,
} from '../src/app/components/mirror/lib/scoring';
import type { SetResponse, BaselineResponses } from '../src/app/components/mirror/types';

const baseline: BaselineResponses = {
  wardrobeSize: 'minimal', shoppingFrequency: 'rarely',
  disposalHabit: 'periodically', primaryDriver: 'function',
};

const functionalPurchase: SetResponse = {
  setType: 'A', garmentType: 't-shirt', howGot: 'bought-secondhand', cost: '60',
  wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar', timestamp: 't',
};

describe('calculateValuesFromMirrorGame (reflected, behaviour-only)', () => {
  it('ignores baseline and returns the reflected profile', () => {
    const withBaseline = calculateValuesFromMirrorGame([functionalPurchase], baseline);
    const withoutBaseline = calculateValuesFromMirrorGame([functionalPurchase], null);
    expect(withBaseline).toEqual(withoutBaseline); // baseline no longer leaks into behaviour
    expect(withBaseline.functional).toBeGreaterThan(70);
  });

  it('returns a valid 4-key ValueMeters for an empty run', () => {
    expect(calculateValuesFromMirrorGame([], null)).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });
});

describe('calculatePersona (prototype distance)', () => {
  it('keeps the six existing names and the "The " prefix', () => {
    const p = calculatePersona({ functional: 90, social: 40, emotional: 40, inflowOutflow: 55 });
    expect(p.name).toBe('The Functional Minimalist');
    expect(p.icon).toBe('⚙️');
  });

  it('assigns Conscious Curator to a high-circularity profile', () => {
    const p = calculatePersona({ functional: 55, social: 45, emotional: 50, inflowOutflow: 88 });
    expect(p.name).toBe('The Conscious Curator');
  });

  it('assigns Balanced Adapter to a flat profile', () => {
    const p = calculatePersona({ functional: 52, social: 50, emotional: 53, inflowOutflow: 49 });
    expect(p.name).toBe('The Balanced Adapter');
  });
});

describe('calculateExpectationProfile', () => {
  it('derives the self-image profile from baseline only', () => {
    const e = calculateExpectationProfile(baseline);
    expect(e.functional).toBeGreaterThan(70);
    expect(e.social).toBeLessThan(50);
  });
});

describe('calculateReflectionConfidence', () => {
  it('is low for one set and high for three', () => {
    expect(calculateReflectionConfidence([functionalPurchase])).toBe('low');
    expect(calculateReflectionConfidence([functionalPurchase, { ...functionalPurchase, setType: 'B' } as SetResponse, { ...functionalPurchase, setType: 'C' } as SetResponse])).toBe('high');
  });
});
