import { describe, it, expect } from 'vitest';
import { normalizeAxis, scoreProfile, scoreReflected, scoreExpectation, assignArchetype, calculateConfidenceLevel } from '../src/app/components/mirror/lib/scoring-engine';
import { BEHAVIOUR_SPECS, costBand, yearsBand } from '../src/app/components/mirror/lib/scoring-config';
import { BASELINE_SPECS, PROTOTYPES, type ArchetypeKey } from '../src/app/components/mirror/lib/scoring-config';
import type { SetAResponse, SetResponse, BaselineResponses } from '../src/app/components/mirror/types';

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
    // mainUse ['leisure'] -> functional and social both primary, neutral (0) -> den counts, num 0
    const { values, evidence } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['leisure']]]);
    expect(values.functional).toBe(50); // primary, neutral -> den=2 num=0 -> 50
    expect(values.social).toBe(50);     // primary, neutral -> den=2 num=0 -> 50
    expect(evidence.social).toBe(2);    // social denominator recorded
  });

  it('lets a reverse-keyed answer pull an axis below 50 (2026-06-11 recalibration)', () => {
    // mainUse ['work'] -> functional +1 (w2, P) ; social -0.3 (w2, P): 50 + 50*(-0.3) = 35
    const { values } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work']]]);
    expect(values.functional).toBe(100);
    expect(values.social).toBe(35);
  });

  it('uses max-magnitude direction per axis for multi-select', () => {
    // mainUse ['work','not-in-use'] -> functional: max(|+1|,|-1|) tie -> table order, 'work' first -> +1
    const { values } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work', 'not-in-use']]]);
    expect(values.functional).toBe(100);
  });

  it('scores multi-select identically regardless of selection (tap) order', () => {
    // 'work' (+1) and 'not-in-use' (-1) tie on |functional|; the score must not
    // depend on which tile the participant tapped first.
    const workFirst = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work', 'not-in-use']]]);
    const notInUseFirst = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['not-in-use', 'work']]]);
    expect(notInUseFirst.values).toEqual(workFirst.values);
  });
});

describe('scoreReflected', () => {
  it('scores a clearly functional + circular Set A purchase', () => {
    // Hand computation (spec §4.1 + 2026-06-11 recalibration), Set A only:
    //   howGot bought-secondhand: C(w2,P,+1) E(w2,s,0 -> excluded) F(w1,s,+0.5)
    //   cost '60' -> 21-75: F(w2,P,0)
    //   wearFrequency once-a-week: F(w2,P,+1) C(w1,s,+0.5)
    //   mainUse ['work']: F(w2,P,+1) S(w2,P,-0.3) C(w1,s,0 -> excluded)
    //   whyBought replace-similar: S(w2,P,-0.3) C(w2,P,+0.3) F(w1,s,+1)
    // F: num 0.5+0+2+2+1 = 5.5 ; den 1+2+2+2+1 = 8 -> 50+50*0.6875 = 84
    // S: num -0.6-0.6 = -1.2 ; den 2+2 = 4 -> 50+50*(-0.3) = 35
    // E: den 0 -> 50
    // C: num 2+0.5+0.6 = 3.1 ; den 2+1+2 = 5 -> 50+50*0.62 = 81
    const a: SetAResponse = {
      setType: 'A', garmentType: 't-shirt', howGot: 'bought-secondhand', cost: '60',
      wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar',
      timestamp: 't',
    };
    const { values } = scoreReflected([a]);
    expect(values).toEqual({ functional: 84, social: 35, emotional: 50, inflowOutflow: 81 });
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
    // spread 5 < 8 -> balanced even though numbers lean functional
    expect(assignArchetype({ functional: 55, social: 52, emotional: 54, inflowOutflow: 50 })).toBe('balancedAdapter');
  });

  it('routes a no-evidence neutral profile to balancedAdapter, not the nearest corner', () => {
    expect(assignArchetype({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 })).toBe('balancedAdapter');
  });

  it('assigns a clearly functional profile to functionalMinimalist', () => {
    expect(assignArchetype({ functional: 90, social: 40, emotional: 40, inflowOutflow: 55 })).toBe('functionalMinimalist');
  });

  it('assigns a high-circularity profile to consciousCurator (not the old conflation)', () => {
    expect(assignArchetype({ functional: 55, social: 45, emotional: 50, inflowOutflow: 88 })).toBe('consciousCurator');
  });
});

// 2026-06-11 recalibration: six archetypal full sessions (A+B+C), one per persona.
// Each must assign to its intended persona — guarantees every archetype is reachable
// by a coherent, realistic answer pattern, not just by its exact prototype point.
describe('archetypal answer patterns reach their persona', () => {
  const A = (o: Partial<SetAResponse>) => ({ setType: 'A', garmentType: 'x', timestamp: 't', ...o }) as SetResponse;
  const B = (o: object) => ({ setType: 'B', garmentType: 'x', timestamp: 't', ...o }) as SetResponse;
  const C = (o: object) => ({ setType: 'C', garmentType: 'x', timestamp: 't', ...o }) as SetResponse;
  const persona = (rs: SetResponse[]) => assignArchetype(scoreReflected(rs).values);

  it('pure utility pattern -> functionalMinimalist', () => {
    expect(persona([
      A({ howGot: 'bought-new', cost: '90', wearFrequency: 'once-a-week', mainUse: ['work', 'home'], whyBought: 'replace-similar' }),
      B({ howGot: 'bought-new', cost: '80', howLongHad: '3-4-years', wearFrequency: 'once-a-week', mainUse: ['work'], whyFavorite: ['comfortable'], washFrequency: 'few-times', repaired: 'no' }),
      C({ howLongHad: '4', cost: '60', howGot: 'bought-new', whyNotWear: ['doesnt-fit'], disposalPlan: 'textile-bins' }),
    ])).toBe('functionalMinimalist');
  });

  it('image/trend/newness pattern -> socialChameleon', () => {
    expect(persona([
      A({ howGot: 'bought-new', cost: '120', wearFrequency: 'once-a-week', mainUse: ['special-occasions'], whyBought: 'wanted-new' }),
      B({ howGot: 'bought-new', cost: '100', howLongHad: 'less-1-year', wearFrequency: 'once-a-week', mainUse: ['special-occasions'], whyFavorite: ['confident', 'easy-to-style'], washFrequency: 'every-time', repaired: 'no' }),
      C({ howLongHad: '1', cost: '80', howGot: 'bought-new', whyNotWear: ['out-of-style', 'dont-like-anymore'], disposalPlan: 'sell-it' }),
    ])).toBe('socialChameleon');
  });

  it('gift/memory/retention pattern -> memoryKeeper', () => {
    expect(persona([
      A({ howGot: 'gift', cost: '40', wearFrequency: 'once-a-month', mainUse: ['home'], whyBought: 'other' }),
      B({ howGot: 'gift', cost: '30', howLongHad: '7-plus-years', wearFrequency: 'once-a-month', mainUse: ['home'], whyFavorite: ['personal-emotional'], washFrequency: 'when-dirty', repaired: 'no-but-would' }),
      C({ howLongHad: '10', cost: '20', howGot: 'gift', whyNotWear: ['waiting-occasion'], disposalPlan: 'gift-friends-family' }),
    ])).toBe('memoryKeeper');
  });

  it('identity + sentiment pattern -> identityCollector', () => {
    expect(persona([
      A({ howGot: 'bought-new', cost: '100', wearFrequency: 'once-a-week', mainUse: ['special-occasions'], whyBought: 'wanted-new' }),
      B({ howGot: 'gift', cost: '150', howLongHad: '5-6-years', wearFrequency: 'once-a-month', mainUse: ['special-occasions'], whyFavorite: ['confident', 'personal-emotional'], washFrequency: 'when-dirty', repaired: 'no' }),
      C({ howLongHad: '6', cost: '50', howGot: 'bought-new', whyNotWear: ['waiting-occasion', 'out-of-style'], disposalPlan: 'donate-charity' }),
    ])).toBe('identityCollector');
  });

  it('second-hand/repair/lifecycle pattern -> consciousCurator', () => {
    expect(persona([
      A({ howGot: 'bought-secondhand', cost: '25', wearFrequency: 'once-a-month', mainUse: ['leisure'], whyBought: 'replace-similar' }),
      B({ howGot: 'bought-secondhand', cost: '30', howLongHad: '5-6-years', wearFrequency: 'once-a-month', mainUse: ['leisure'], whyFavorite: ['comfortable'], washFrequency: 'few-times', repaired: 'yes-myself' }),
      C({ howLongHad: '8', cost: '40', howGot: 'bought-secondhand', whyNotWear: ['doesnt-fit'], disposalPlan: 'repair-repurpose' }),
    ])).toBe('consciousCurator');
  });

  it('genuinely mixed pattern -> balancedAdapter', () => {
    expect(persona([
      A({ howGot: 'bought-new', cost: '50', wearFrequency: 'once-a-month', mainUse: ['leisure'], whyBought: 'wanted-new' }),
      B({ howGot: 'gift', cost: '60', howLongHad: '1-2-years', wearFrequency: 'once-a-week', mainUse: ['work', 'special-occasions'], whyFavorite: ['comfortable', 'confident'], washFrequency: 'few-times', repaired: 'no' }),
      C({ howLongHad: '3', cost: '30', howGot: 'bought-secondhand', whyNotWear: ['dont-like-anymore'], disposalPlan: 'donate-charity' }),
    ])).toBe('balancedAdapter');
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
