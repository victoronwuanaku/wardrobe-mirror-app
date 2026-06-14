import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BEHAVIOUR_SPECS, BASELINE_SPECS } from '../src/app/components/mirror/lib/scoring-config';
import { BASELINE_QUESTIONS } from '../src/app/components/mirror/constants/baselineQuestions';

// Guards the UI -> scoring-config contract: an unknown answer value scores direction 0
// while a primary axis still counts in the denominator, so a renamed/added UI option
// that is missing from the directions table silently dilutes scores toward 50
// (this exact failure happened once: the pre-redesign useChanged scorer checked stale
// option values and zero-scored all Set B respondents).

const QUESTIONS_DIR = join(__dirname, '../src/app/components/mirror/questions');
const QUESTION_FILES = ['SetAQuestion.tsx', 'SetBQuestion.tsx', 'SetCQuestion.tsx'];

// Scored selection fields -> BEHAVIOUR_SPECS key. Free-text fields (cost, Set C
// howLongHad years) resolve through bucket() and are not tile literals; garmentType
// is descriptive only and never scored.
const FIELD_TO_SPEC: Record<string, string> = {
  howGot: 'howGot',
  wearFrequency: 'wearFrequency',
  mainUse: 'mainUse',
  whyBought: 'whyBought',
  whyFavorite: 'whyFavorite',
  howLongHad: 'howLongHadCategorical', // tile literals exist only in Set B
  washFrequency: 'washFrequency',
  repaired: 'repaired',
  whyNotWear: 'whyNotWear',
  disposalPlan: 'disposalPlan',
};
const UNSCORED_FIELDS = new Set(['garmentType']);

function extractOptionPairs(): Array<{ field: string; value: string; file: string }> {
  const pairs: Array<{ field: string; value: string; file: string }> = [];
  for (const file of QUESTION_FILES) {
    const source = readFileSync(join(QUESTIONS_DIR, file), 'utf8');
    for (const m of source.matchAll(/on(?:Answer|MultiSelectToggle)\('(\w+)',\s*'([^']+)'\)/g)) {
      pairs.push({ field: m[1], value: m[2], file });
    }
    // handleOtherSelection stores the literal value 'other' on the field.
    for (const m of source.matchAll(/onOtherSelection\('(\w+)'\)/g)) {
      pairs.push({ field: m[1], value: 'other', file });
    }
  }
  return pairs;
}

describe('UI option values <-> scoring config contract', () => {
  const pairs = extractOptionPairs();

  it('extraction still finds every scored field (guards against UI refactors blinding this test)', () => {
    const seen = new Set(pairs.map((p) => p.field));
    for (const field of Object.keys(FIELD_TO_SPEC)) {
      expect(seen, `no option literals extracted for '${field}' — update the extraction regex or FIELD_TO_SPEC`).toContain(field);
    }
  });

  it('every selectable field is either mapped to a spec or explicitly unscored', () => {
    for (const { field, file } of pairs) {
      expect(
        field in FIELD_TO_SPEC || UNSCORED_FIELDS.has(field),
        `'${field}' (${file}) is neither mapped in FIELD_TO_SPEC nor listed in UNSCORED_FIELDS — decide whether it is scored`,
      ).toBe(true);
    }
  });

  it('every UI option value has a directions entry in its behaviour spec', () => {
    for (const { field, value, file } of pairs) {
      const specKey = FIELD_TO_SPEC[field];
      if (!specKey) continue; // unscored fields checked above
      const spec = BEHAVIOUR_SPECS[specKey];
      expect(spec, `spec '${specKey}' missing for field '${field}'`).toBeDefined();
      expect(
        Object.prototype.hasOwnProperty.call(spec.directions, value),
        `option '${value}' for '${field}' (${file}) has no entry in BEHAVIOUR_SPECS.${specKey}.directions — it would silently score as neutral`,
      ).toBe(true);
    }
  });

  it('every baseline option value has a directions entry in its baseline spec', () => {
    for (const q of BASELINE_QUESTIONS) {
      const spec = BASELINE_SPECS[q.id];
      expect(spec, `baseline spec missing for '${q.id}'`).toBeDefined();
      for (const option of q.options) {
        expect(
          Object.prototype.hasOwnProperty.call(spec.directions, option.value),
          `baseline option '${option.value}' for '${q.id}' has no entry in BASELINE_SPECS.${q.id}.directions`,
        ).toBe(true);
      }
    }
  });
});
