// Pilot-data analysis harness — the canonical re-scorer for the research dataset.
//
// Skipped in normal `pnpm test`. Run explicitly with:
//   PILOT_CSV=Notes/wardrobe_responses_full_2026-06-11.csv npx vitest run tests/pilot-analysis.test.ts
//
// Reads a Supabase CSV export of `wardrobe_responses`, normalizes legacy answer formats,
// flags suspected test sessions, re-scores every session uniformly with the CURRENT engine,
// and writes:
//   - docs/analysis/pilot-rescored-sessions.csv  (paper dataset: one row per session)
//   - docs/analysis/pilot-analysis-report.txt    (distributions, percentiles, flags, face-validity)
import { describe, it } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { scoreReflected, assignArchetype } from '../src/app/components/mirror/lib/scoring-engine';
import type { SetResponse, ValueMeters } from '../src/app/components/mirror/types';

const PILOT_CSV = process.env.PILOT_CSV;

// ---------- CSV parsing (handles quoted fields with commas/newlines) ----------
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------- legacy normalization (pre-2026-06-04 option formats) ----------
const LEGACY_COST: Record<string, string> = { 'free': '0', '1-20': '10', '21-50': '35', '51-100': '75', '100+': '150' };
const FAVORITE_KEYS = new Set(['comfortable', 'easy-to-style', 'confident', 'personal-emotional', 'other', 'skipped', '']);
const split = (s: string) => s.split(';').map(x => x.trim()).filter(Boolean);

interface Row { [k: string]: string }
interface Session {
  id: string; rows: Row[]; firstTs: number; lastTs: number; sets: string[];
  storedPersona: string; flags: string[]; rescored?: ValueMeters; persona?: string; legacy: boolean;
}

function toResponse(r: Row): SetResponse | null {
  const cost = LEGACY_COST[r.cost] ?? r.cost;
  if (r.set_type === 'A') {
    return { setType: 'A', garmentType: r.garment_type, howGot: r.how_got, cost,
      wearFrequency: r.wear_frequency, mainUse: split(r.main_use), mainUseOther: r.main_use_other,
      whyBought: r.why_bought, whyBoughtOther: r.why_bought_other, timestamp: r.completed_at } as SetResponse;
  }
  if (r.set_type === 'B') {
    const favTokens = split(r.why_favorite);
    const known = favTokens.filter(t => FAVORITE_KEYS.has(t));
    // legacy free-text favourite (old UI): not mappable to current options -> treat as unanswered
    const whyFavorite = favTokens.length && known.length === 0 ? [] : known;
    return { setType: 'B', garmentType: r.garment_type, whyFavorite, whyFavoriteOther: r.why_favorite_other,
      howGot: r.how_got, cost, howLongHad: r.how_long_had, wearFrequency: r.wear_frequency,
      mainUse: split(r.main_use), mainUseOther: r.main_use_other, washFrequency: r.wash_frequency,
      repaired: r.repaired, timestamp: r.completed_at } as SetResponse;
  }
  if (r.set_type === 'C') {
    return { setType: 'C', garmentType: r.garment_type, howLongHad: r.how_long_had_years || r.how_long_had,
      cost, howGot: r.how_got, whyNotWear: split(r.why_not_wear), whyNotWearOther: r.why_not_wear_other,
      disposalPlan: r.disposal_plan, timestamp: r.completed_at } as SetResponse;
  }
  return null;
}

// ---------- suspected-test-session flags ----------
const TEST_TEXT = /(\btest\b|^hi$|\bbored\b)/i;
function flagSession(s: Session) {
  const freeTexts: string[] = [];
  let leadZeroCost = false, hugeCost = false, hugeYears = false, skippedCount = 0, fieldCount = 0;
  for (const r of s.rows) {
    freeTexts.push(r.main_use_other, r.why_bought_other, r.why_favorite_other, r.why_not_wear_other, r.garment_type, r.why_favorite);
    if (/^0\d+$/.test(r.cost.trim())) leadZeroCost = true;
    const c = parseFloat(LEGACY_COST[r.cost] ?? r.cost);
    if (!Number.isNaN(c) && c > 500) hugeCost = true;
    const y = parseInt(r.how_long_had_years || (r.set_type === 'C' ? r.how_long_had : ''), 10);
    if (!Number.isNaN(y) && y > 30) hugeYears = true;
    const core = r.set_type === 'A'
      ? [r.how_got, r.cost, r.wear_frequency, r.main_use, r.why_bought]
      : r.set_type === 'B'
        ? [r.how_got, r.cost, r.wear_frequency, r.main_use, r.why_favorite, r.how_long_had]
        : [r.how_got, r.cost, r.why_not_wear, r.disposal_plan];
    for (const f of core) { fieldCount++; if (!f || f === 'skipped') skippedCount++; }
  }
  if (freeTexts.some(t => t && TEST_TEXT.test(t.trim()))) s.flags.push('test-text');
  if (leadZeroCost) s.flags.push('07-cost');
  if (hugeCost) s.flags.push('cost>500');
  if (hugeYears) s.flags.push('years>30');
  if (s.rows.length >= 2) {
    const perSet = (s.lastTs - s.firstTs) / 1000 / (s.rows.length - 1);
    if (perSet < 45) s.flags.push(`fast(${Math.round(perSet)}s/set)`);
  }
  if (skippedCount / fieldCount > 0.6) s.flags.push('mostly-skipped');
}

const DISPLAY: Record<string, string> = {
  functionalMinimalist: 'Functional Minimalist', socialChameleon: 'Social Chameleon',
  memoryKeeper: 'Memory Keeper', identityCollector: 'Identity Collector',
  consciousCurator: 'Conscious Curator', balancedAdapter: 'Balanced Adapter',
};
const ORDER = Object.values(DISPLAY);

function tallyLines(sessions: Session[]): string {
  const re: Record<string, number> = {}, st: Record<string, number> = {};
  const mean = [0, 0, 0, 0];
  for (const s of sessions) {
    re[s.persona!] = (re[s.persona!] || 0) + 1;
    const sp = s.storedPersona.replace(/^The /, '');
    st[sp] = (st[sp] || 0) + 1;
    const v = s.rescored!;
    mean[0] += v.functional; mean[1] += v.social; mean[2] += v.emotional; mean[3] += v.inflowOutflow;
  }
  const n = sessions.length;
  let out = `n=${n} sessions   mean re-scored [F S E C] = [${mean.map(m => (m / n).toFixed(0)).join(' ')}]\n`;
  out += `${'persona'.padEnd(24)} ${'stored'.padStart(8)} ${'re-scored'.padStart(10)}\n`;
  for (const p of ORDER) {
    out += `${p.padEnd(24)} ${String(st[p] || 0).padStart(6)} ${(100 * (st[p] || 0) / n).toFixed(0).padStart(3)}% ${String(re[p] || 0).padStart(6)} ${(100 * (re[p] || 0) / n).toFixed(0).padStart(3)}%\n`;
  }
  return out;
}

function summarizeAnswers(s: Session): string {
  return s.rows.map(r => {
    const bits = [r.set_type, r.garment_type, r.how_got, `€${r.cost}`, r.wear_frequency, r.main_use, r.why_bought, r.why_favorite, r.repaired, r.why_not_wear, r.disposal_plan]
      .filter(Boolean).join(' | ');
    return `    ${bits}`;
  }).join('\n');
}

describe.runIf(!!PILOT_CSV)('pilot CSV analysis (env-gated)', () => {
  it('re-scores all sessions and writes report + paper dataset', () => {
    const csv = readFileSync(join(process.cwd(), PILOT_CSV!), 'utf8');
    const [header, ...data] = parseCSV(csv);
    const rows: Row[] = data.map(cells => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));

    const bySession = new Map<string, Session>();
    for (const r of rows) {
      let s = bySession.get(r.session_id);
      if (!s) { s = { id: r.session_id, rows: [], firstTs: Infinity, lastTs: -Infinity, sets: [], storedPersona: r.persona, flags: [], legacy: false }; bySession.set(r.session_id, s); }
      s.rows.push(r);
      const ts = Date.parse(r.completed_at);
      s.firstTs = Math.min(s.firstTs, ts); s.lastTs = Math.max(s.lastTs, ts);
      s.sets.push(r.set_type);
      if (LEGACY_COST[r.cost] !== undefined || (split(r.why_favorite).length && split(r.why_favorite).every(t => !FAVORITE_KEYS.has(t)))) s.legacy = true;
    }

    const sessions = [...bySession.values()].sort((a, b) => a.firstTs - b.firstTs);
    for (const s of sessions) {
      flagSession(s);
      const responses = s.rows.map(toResponse).filter((x): x is SetResponse => !!x);
      s.rescored = scoreReflected(responses).values;
      s.persona = DISPLAY[assignArchetype(s.rescored)];
    }

    let out = `rows=${rows.length} sessions=${sessions.length} legacy-format sessions=${sessions.filter(s => s.legacy).length}\n`;
    const flagged = sessions.filter(s => s.flags.length > 0);
    out += `\n--- FLAGGED SESSIONS (${flagged.length}) ---\n`;
    for (const s of flagged) {
      out += `${new Date(s.firstTs).toISOString().slice(0, 16)}  ${s.id.padEnd(26)} sets=${s.sets.join('')}  stored="${s.storedPersona.replace(/^The /, '')}"  flags: ${s.flags.join(', ')}\n`;
    }
    out += `\n--- ALL SESSIONS ---\n${tallyLines(sessions)}`;
    const clean = sessions.filter(s => s.flags.length === 0);
    out += `\n--- CLEAN (unflagged) SESSIONS ---\n${tallyLines(clean)}`;
    const clean3 = clean.filter(s => s.rows.length === 3);
    out += `\n--- CLEAN, FULL 3-SET SESSIONS ---\n${tallyLines(clean3)}`;

    // Per-axis percentiles over clean sessions (prototype-anchoring reference)
    const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.round((p / 100) * (sorted.length - 1)))];
    out += `\n--- CLEAN-SESSION PERCENTILES (n=${clean.length}) ---\naxis   p10  p15  p25  p50  p75  p85  p90  min  max\n`;
    for (const axis of ['functional', 'social', 'emotional', 'inflowOutflow'] as const) {
      const vals = clean.map(s => s.rescored![axis]).sort((a, b) => a - b);
      out += `${axis.padEnd(14)}${[10, 15, 25, 50, 75, 85, 90].map(p => String(pct(vals, p)).padStart(5)).join('')}${String(vals[0]).padStart(5)}${String(vals[vals.length - 1]).padStart(5)}\n`;
    }

    // Face-validity dump: up to 3 clean sessions per persona with condensed answers
    out += `\n--- FACE-VALIDITY SAMPLES (clean sessions, up to 3 per persona) ---\n`;
    for (const p of ORDER) {
      const examples = clean.filter(s => s.persona === p).slice(0, 3);
      out += `\n${p} (${clean.filter(s => s.persona === p).length} clean sessions)\n`;
      for (const s of examples) {
        const v = s.rescored!;
        out += `  ${s.id}  [F${v.functional} S${v.social} E${v.emotional} C${v.inflowOutflow}]\n${summarizeAnswers(s)}\n`;
      }
    }

    // Paper dataset: one row per session, uniformly re-scored
    const esc = (x: string) => /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x;
    let paper = 'session_id,first_completed_at,sets_completed,legacy_format,functional,social,emotional,inflow_outflow,stored_persona,rescored_persona,excluded,flag_reasons\n';
    for (const s of sessions) {
      const v = s.rescored!;
      paper += [s.id, new Date(s.firstTs).toISOString(), s.rows.length, s.legacy ? 'yes' : 'no',
        v.functional, v.social, v.emotional, v.inflowOutflow,
        esc(s.storedPersona), esc(s.persona!), s.flags.length ? 'yes' : 'no', esc(s.flags.join('; '))].join(',') + '\n';
    }

    mkdirSync(join(process.cwd(), 'docs/analysis'), { recursive: true });
    writeFileSync(join(process.cwd(), 'docs/analysis/pilot-analysis-report.txt'), out);
    writeFileSync(join(process.cwd(), 'docs/analysis/pilot-rescored-sessions.csv'), paper);
  });
});
