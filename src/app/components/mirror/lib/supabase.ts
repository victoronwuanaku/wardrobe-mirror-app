import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publishableKey } from '../../../../../utils/supabase/info';
import type { GameData, SubmissionResult } from '../types';

export async function submitToSupabase(data: GameData): Promise<SubmissionResult> {
  console.log('🔄 submitToSupabase called for session', data.sessionId);
  try {
    const supabase = createClient(supabaseUrl, publishableKey);

    const rows = data.responses.map(r => {
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
        };
      } else {
        return {
          ...base,
          how_got: r.howGot || '', cost: r.cost || '',
          wear_frequency: '', main_use: '', main_use_other: '',
          why_bought: '', why_bought_other: '',
          how_long_had: r.howLongHad || '',
          why_favorite: '', why_favorite_other: '',
          wash_frequency: '', repaired: '',
          why_not_wear: Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
          why_not_wear_other: r.whyNotWearOther || '',
          disposal_plan: r.disposalPlan || '',
        };
      }
    });

    const doInsert = async () => {
      const { error } = await supabase.from('wardrobe_responses').insert(rows);
      if (error) throw error;
    };

    try {
      await doInsert();
    } catch {
      // Retry once after 3 s to handle transient network issues
      await new Promise(r => setTimeout(r, 3000));
      await doInsert();
    }

    console.log('✅ Data submitted to Supabase:', rows.length, 'rows added');
    return { ok: true };
  } catch (error: any) {
    // Postgres duplicate-key error (23505) means a retry hit rows that were already persisted on a previous attempt — treat as success
    if (error?.code === '23505' || (typeof error?.message === 'string' && error.message.includes('duplicate key'))) {
      console.log('✅ Duplicate key on retry — already persisted, treating as success');
      return { ok: true };
    }
    const errorMessage =
      error?.message ||
      error?.error_description ||
      (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Supabase submission failed after retry:', error);
    return { ok: false, error: errorMessage };
  }
}
