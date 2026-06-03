import { describe, it, expect } from 'vitest';
import { buildSupabaseRows } from '../src/app/components/mirror/lib/supabase';
import { DB_COLUMNS } from '../src/app/components/mirror/lib/schema';
import { generateCSVString } from '../src/app/components/mirror/lib/export';
import type { GameData } from '../src/app/components/mirror/types';

const fixture: GameData = {
  sessionId: 'sess-1',
  timestamp: '2026-06-02T10:00:00.000Z',
  setsCompleted: 3,
  baselineResponses: {
    wardrobeSize: 'moderate',
    shoppingFrequency: 'occasionally',
    disposalHabit: 'periodically',
    primaryDriver: 'function',
  },
  values: { social: 40, emotional: 55, functional: 70, inflowOutflow: 45 },
  persona: 'The Functional Minimalist',
  responses: [
    { setType: 'A', garmentType: 't-shirt', howGot: 'bought-new', cost: '20', wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar', timestamp: '2026-06-02T10:00:00.000Z' },
    { setType: 'B', garmentType: 'jacket-coat', howGot: 'gift', cost: '100', howLongHad: '3-4-years', wearFrequency: 'once-a-month', mainUse: ['leisure'], whyFavorite: ['comfortable'], washFrequency: 'few-times', repaired: 'no', timestamp: '2026-06-02T10:01:00.000Z' },
    { setType: 'C', garmentType: 'jeans-trousers', howLongHad: '5', cost: '60', howGot: 'bought-new', whyNotWear: ['doesnt-fit'], disposalPlan: 'donate-charity', timestamp: '2026-06-02T10:02:00.000Z' },
  ],
};

describe('supabase row schema contract', () => {
  it('every inserted row uses exactly the declared DB columns', () => {
    const rows = buildSupabaseRows(fixture);
    expect(rows).toHaveLength(3);
    const expected = [...DB_COLUMNS].sort();
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(expected);
    }
  });

  it('marks partial sessions', () => {
    const partial = buildSupabaseRows({ ...fixture, responses: fixture.responses.slice(0, 1) });
    expect(partial[0].completion_status).toBe('partial');
    expect(buildSupabaseRows(fixture)[0].completion_status).toBe('complete');
  });

  it('routes Set C retention to how_long_had_years, Set B to how_long_had', () => {
    const rows = buildSupabaseRows(fixture);
    const setB = rows.find((r) => r.set_type === 'B')!;
    const setC = rows.find((r) => r.set_type === 'C')!;
    expect(setB.how_long_had).toBe('3-4-years');
    expect(setB.how_long_had_years).toBe('');
    expect(setC.how_long_had).toBe('');
    expect(setC.how_long_had_years).toBe('5');
  });
});

describe('CSV export width', () => {
  it('header count equals every data row count', () => {
    const lines = generateCSVString(fixture).split('\n');
    const headerCount = lines[0].split(',').length;
    for (const line of lines.slice(1)) {
      expect(line.split(',').length).toBe(headerCount);
    }
  });
});
