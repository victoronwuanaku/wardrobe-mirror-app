import { describe, it, expect } from 'vitest';
import { normalizeAxis, scoreProfile, scoreReflected, scoreExpectation, assignArchetype, calculateConfidenceLevel } from '../src/app/components/mirror/lib/scoring-engine';
import { BEHAVIOUR_SPECS, costBand, yearsBand } from '../src/app/components/mirror/lib/scoring-config';
import { BASELINE_SPECS, PROTOTYPES, type ArchetypeKey } from '../src/app/components/mirror/lib/scoring-config';
import type { SetAResponse, BaselineResponses } from '../src/app/components/mirror/types';

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

describe('scoreReflected', () => {
  it('scores a clearly functional + circular Set A purchase', () => {
    // Hand computation (spec §4.1), Set A only:
    //   howGot bought-secondhand: C(w2,P,+1) E(w2,s,0 -> excluded) F(w1,s,+0.5)
    //   cost '60' -> 21-75: F(w2,P,0)
    //   wearFrequency once-a-week: F(w2,P,+1) C(w1,s,+0.5)
    //   mainUse ['work']: F(w2,P,+1) S(w2,P,0) C(w1,s,0 -> excluded)
    //   whyBought replace-similar: S(w2,P,0) C(w2,P,+0.3) F(w1,s,+1)
    // F: num 0.5+0+2+2+1 = 5.5 ; den 1+2+2+2+1 = 8 -> 50+50*0.6875 = 84
    // S: num 0 ; den 2+2 = 4 -> 50
    // E: den 0 -> 50
    // C: num 2+0.5+0.6 = 3.1 ; den 2+1+2 = 5 -> 50+50*0.62 = 81
    const a: SetAResponse = {
      setType: 'A', garmentType: 't-shirt', howGot: 'bought-secondhand', cost: '60',
      wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar',
      timestamp: 't',
    };
    const { values } = scoreReflected([a]);
    expect(values).toEqual({ functional: 84, social: 50, emotional: 50, inflowOutflow: 81 });
  });

  it('returns all-neutral with no behavioural responses', () => {
    expect(scoreReflected([]).values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });

  it('skips skipped/empty answers', () => {
    const a = {
      setType: 'A', garmentType: 't-shirt', howGot: 'skipped', cost: '',
      wearFrequency: 'skipped', mainUse: [], whyBought: 'skipped', timestamp: 't',
    } as unknown as SetAResponse;
    expect(scoreReflected([a]).values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });
});

describe('scoreExpectation', () => {
  it('reads a function-driven, minimal, rare-shopper self-image', () => {
    // primaryDriver function: F +1(w2), S -0.5(w2), E -0.5(w2)
    // wardrobeSize minimal: C +1(w2,P), F +0.5(w1)
    // shoppingFrequency rarely: C +1(w2,P), F +0.3(w1)
    // disposalHabit periodically: C 0(w2,P)  [emotional secondary, neutral -> excluded]
    // F: num 2 + 0.5 + 0.3 = 2.8 ; den 2 + 1 + 1 = 4 -> 50+50*0.7 = 85
    // S: num -1 ; den 2 -> 50+50*(-0.5) = 25
    // E: num -1 ; den 2 -> 25
    // C: num 2 + 2 + 0 = 4 ; den 2 + 2 + 2 = 6 -> 50+50*0.6667 = 83
    const b: BaselineResponses = {
      wardrobeSize: 'minimal', shoppingFrequency: 'rarely',
      disposalHabit: 'periodically', primaryDriver: 'function',
    };
    expect(scoreExpectation(b).values).toEqual({ functional: 85, social: 25, emotional: 25, inflowOutflow: 83 });
  });

  it('returns all-neutral when baseline is null', () => {
    expect(scoreExpectation(null).values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });
});

describe('assignArchetype', () => {
  it('maps each exact prototype to its own archetype key', () => {
    expect(assignArchetype(PROTOTYPES.functionalMinimalist)).toBe('functionalMinimalist');
    expect(assignArchetype(PROTOTYPES.socialChameleon)).toBe('socialChameleon');
    expect(assignArchetype(PROTOTYPES.memoryKeeper)).toBe('memoryKeeper');
    expect(assignArchetype(PROTOTYPES.identityCollector)).toBe('identityCollector');
    expect(assignArchetype(PROTOTYPES.consciousCurator)).toBe('consciousCurator');
    expect(assignArchetype(PROTOTYPES.balancedAdapter)).toBe('balancedAdapter');
  });

  it('resolves a near-flat profile to balancedAdapter via the dominance gate', () => {
    // spread 8 < 12 -> balanced even though numbers lean functional
    expect(assignArchetype({ functional: 58, social: 52, emotional: 55, inflowOutflow: 50 })).toBe('balancedAdapter');
  });

  it('assigns a clearly functional profile to functionalMinimalist', () => {
    expect(assignArchetype({ functional: 90, social: 40, emotional: 40, inflowOutflow: 55 })).toBe('functionalMinimalist');
  });

  it('assigns a high-circularity profile to consciousCurator (not the old conflation)', () => {
    expect(assignArchetype({ functional: 55, social: 45, emotional: 50, inflowOutflow: 88 })).toBe('consciousCurator');
  });
});

describe('calculateConfidenceLevel', () => {
  it('grades by behavioural sets completed', () => {
    expect(calculateConfidenceLevel(0)).toBe('low');
    expect(calculateConfidenceLevel(1)).toBe('low');
    expect(calculateConfidenceLevel(2)).toBe('medium');
    expect(calculateConfidenceLevel(3)).toBe('high');
  });
});
