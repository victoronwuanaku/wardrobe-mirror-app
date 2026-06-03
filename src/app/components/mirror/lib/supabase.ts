/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publishableKey } from '../../../../../utils/supabase/info';
import type { GameData, SetResponse, SubmissionResult } from '../types';

// Pure: build the rows the app inserts. Kept separate from network code so the
// schema-contract test can assert the emitted keys match the DB columns.
export function buildSupabaseRows(data: GameData): Record<string, unknown>[] {
  const completionStatus = data.responses.length >= 3 ? 'complete' : 'partial';
  return data.responses.map((r: SetResponse) => {
    const base = {
      session_id:           data.sessionId,
      completed_at:         r.timestamp,
      wardrobe_size:        data.baselineResponses?.wardrobeSize || '',
      shopping_frequency:   data.baselineResponses?.shoppingFrequency || '',
      disposal_habit:       data.baselineResponses?.disposalHabit || '',
      primary_driver:       data.baselineResponses?.primaryDriver || '',
      persona:              data.persona || '',
      social_value:         data.values?.social ?? null,
      emotional_value:      data.values?.emotional ?? null,
      functional_value:     data.values?.functional ?? null,
      inflow_outflow_value: data.values?.inflowOutflow ?? null,
      set_type:             r.setType,
      garment_type:         r.garmentType || '',
      consent_given:        null,
      consent_timestamp:    null,
      completion_status:    completionStatus,
    };

    if (r.setType === 'A') {
      return {
        ...base,
        how_got: r.howGot || '', cost: r.cost || '', wear_frequency: r.wearFrequency || '',
        main_use: Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
        main_use_other: r.mainUseOther || '',
        why_bought: r.whyBought || '', why_bought_other: r.whyBoughtOther || '',
        how_long_had: '',
        why_favorite: '', why_favorite_other: '',
        wash_frequency: '', repaired: '',
        why_not_wear: '', why_not_wear_other: '', disposal_plan: '',
        how_long_had_years: '',
      };
    } else if (r.setType === 'B') {
      return {
        ...base,
        how_got: r.howGot || '', cost: r.cost || '', wear_frequency: r.wearFrequency || '',
        main_use: Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
        main_use_other: r.mainUseOther || '',
        why_bought: '', why_bought_other: '',
        how_long_had: r.howLongHad || '',
        why_favorite: Array.isArray(r.whyFavorite) ? r.whyFavorite.join('; ') : r.whyFavorite || '',
        why_favorite_other: r.whyFavoriteOther || '',
        wash_frequency: r.washFrequency || '', repaired: r.repaired || '',
        why_not_wear: '', why_not_wear_other: '', disposal_plan: '',
        how_long_had_years: '',
      };
    } else {
      return {
        ...base,
        how_got: r.howGot || '', cost: r.cost || '',
        wear_frequency: '', main_use: '', main_use_other: '',
        why_bought: '', why_bought_other: '',
        how_long_had: '',
        why_favorite: '', why_favorite_other: '',
        wash_frequency: '', repaired: '',
        why_not_wear: Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
        why_not_wear_other: r.whyNotWearOther || '',
        disposal_plan: r.disposalPlan || '',
        how_long_had_years: r.howLongHad || '',
      };
    }
  });
}

export async function submitToSupabase(data: GameData): Promise<SubmissionResult> {
  if (import.meta.env.DEV) console.log('submitToSupabase called for session', data.sessionId);
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const rows = buildSupabaseRows(data);

    const doInsert = async () => {
      const { error } = await supabase.from('wardrobe_responses').insert(rows);
      if (error) throw error;
    };

    try {
      await doInsert();
    } catch {
      // Retry once after 3 s to handle transient network issues
      await new Promise((r) => setTimeout(r, 3000));
      await doInsert();
    }

    if (import.meta.env.DEV) console.log('Data submitted to Supabase:', rows.length, 'rows added');
    return { ok: true };
  } catch (error: any) {
    // Postgres duplicate-key (23505): a retry hit rows already persisted — treat as success
    if (error?.code === '23505' || (typeof error?.message === 'string' && error.message.includes('duplicate key'))) {
      if (import.meta.env.DEV) console.log('Duplicate key on retry — already persisted, treating as success');
      return { ok: true };
    }
    const errorMessage =
      error?.message ||
      error?.error_description ||
      (typeof error === 'string' ? error : 'Unknown error');
    console.error('Supabase submission failed after retry:', error);
    return { ok: false, error: errorMessage };
  }
}
