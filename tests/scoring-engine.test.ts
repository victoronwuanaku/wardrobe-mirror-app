import { describe, it, expect } from 'vitest';
import { normalizeAxis } from '../src/app/components/mirror/lib/scoring-engine';
import { BEHAVIOUR_SPECS, costBand, yearsBand } from '../src/app/components/mirror/lib/scoring-config';
import { BASELINE_SPECS, PROTOTYPES, type ArchetypeKey } from '../src/app/components/mirror/lib/scoring-config';

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

describe('baseline specs + prototypes', () => {
  it('declares a spec for every baseline field', () => {
    for (const key of ['primaryDriver', 'wardrobeSize', 'shoppingFrequency', 'disposalHabit']) {
      expect(BASELINE_SPECS[key]).toBeDefined();
    }
  });
  it('defines all six archetype prototypes with four axes each', () => {
    const keys: ArchetypeKey[] = [
      'functionalMinimalist', 'socialChameleon', 'memoryKeeper',
      'identityCollector', 'consciousCurator', 'balancedAdapter',
    ];
    for (const k of keys) {
      const p = PROTOTYPES[k];
      expect(p).toBeDefined();
      expect(typeof p.functional).toBe('number');
      expect(typeof p.social).toBe('number');
      expect(typeof p.emotional).toBe('number');
      expect(typeof p.inflowOutflow).toBe('number');
    }
  });
});

import { scoreProfile } from '../src/app/components/mirror/lib/scoring-engine';

describe('scoreProfile', () => {
  it('returns neutral 50 on every axis with no evidence', () => {
    const { values } = scoreProfile([]);
    expect(values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });

  it('scores a single strong-functional behavioural answer above neutral on functional', () => {
    // wearFrequency once-a-week -> functional +1 (w2, primary), inflowOutflow +0.5 (w1)
    const { values } = scoreProfile([[BEHAVIOUR_SPECS.wearFrequency, 'once-a-week']]);
    // functional: 50 + 50*(2*1 / 2) = 100 ; inflowOutflow: 50 + 50*(1*0.5 / 1) = 75
    expect(values.functional).toBe(100);
    expect(values.inflowOutflow).toBe(75);
    expect(values.social).toBe(50);    // no evidence
    expect(values.emotional).toBe(50); // no evidence
  });

  it('counts a primary-probe neutral answer in the denominator (pulls toward 50)', () => {
    // mainUse ['work'] -> functional primary +1 ; social primary but neutral (0) -> den counts, num 0
    const { values, evidence } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work']]]);
    expect(values.functional).toBe(100); // 50 + 50*(2*1/2)
    expect(values.social).toBe(50);      // primary, neutral -> den=2 num=0 -> 50
    expect(evidence.social).toBe(2);     // social denominator recorded
  });

  it('uses max-magnitude direction per axis for multi-select', () => {
    // mainUse ['work','not-in-use'] -> functional: max(|+1|,|-1|) first wins -> +1
    const { values } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work', 'not-in-use']]]);
    expect(values.functional).toBe(100);
  });
});
