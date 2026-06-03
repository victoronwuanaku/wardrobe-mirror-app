import type { GameData, SetResponse } from '../types';

export function exportGameData(data: GameData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wardrobe-diagnostic-${data.sessionId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCSV(data: GameData): void {
  const csvString = generateCSVString(data);
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wardrobe-diagnostic-${data.sessionId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function csvQuote(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Format a UTC ISO string as Amsterdam local time (DST-aware) in "YYYY-MM-DD HH:mm:ss" form.
// 'sv-SE' locale renders that exact ISO-like layout without timezone-converter dependencies.
export function formatAmsterdamTimestamp(isoUtc: string): string {
  if (!isoUtc) return '';
  return new Date(isoUtc).toLocaleString('sv-SE', { timeZone: 'Europe/Amsterdam' });
}

export function buildResponseRow(data: GameData, r: SetResponse): (string | number)[] {
  const base: (string | number)[] = [
    data.sessionId,
    formatAmsterdamTimestamp(r.timestamp),
    data.baselineResponses?.wardrobeSize || '',
    data.baselineResponses?.shoppingFrequency || '',
    data.baselineResponses?.disposalHabit || '',
    data.baselineResponses?.primaryDriver || '',
    data.persona || '',
    data.responses.length >= 3 ? 'complete' : 'partial',
    data.values?.social ?? '',
    data.values?.emotional ?? '',
    data.values?.functional ?? '',
    data.values?.inflowOutflow ?? '',
    r.setType,
    r.garmentType || '',
  ];

  if (r.setType === 'A') {
    return [
      ...base,
      r.howGot || '', r.cost || '', r.wearFrequency || '',
      Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
      r.mainUseOther || '',
      r.whyBought || '', r.whyBoughtOther || '',
      '', '', '',                                // howLongHad, whyFavorite, whyFavoriteOther
      '', '',                                    // washFrequency, repaired
      '', '', '',                                // whyNotWear, whyNotWearOther, disposalPlan
      ''                                         // howLongHadYears (Set A: none)
    ];
  } else if (r.setType === 'B') {
    return [
      ...base,
      r.howGot || '', r.cost || '', r.wearFrequency || '',
      Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
      r.mainUseOther || '',
      '', '',                                    // whyBought, whyBoughtOther
      r.howLongHad || '',
      Array.isArray(r.whyFavorite) ? r.whyFavorite.join('; ') : r.whyFavorite || '',
      r.whyFavoriteOther || '',
      r.washFrequency || '', r.repaired || '',
      '', '', '',                                // whyNotWear, whyNotWearOther, disposalPlan
      ''                                         // howLongHadYears (Set B: none)
    ];
  } else {
    return [
      ...base,
      r.howGot || '', r.cost || '',
      '', '', '', '', '',                        // wearFrequency, mainUse, mainUseOther, whyBought, whyBoughtOther
      '',                                        // howLongHad (Set C now uses howLongHadYears)
      '', '',                                    // whyFavorite, whyFavoriteOther
      '', '',                                    // washFrequency, repaired
      Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
      r.whyNotWearOther || '',
      r.disposalPlan || '',
      r.howLongHad || ''                         // howLongHadYears
    ];
  }
}

export function generateCSVString(data: GameData): string {
  const headers = [
    'Session ID', 'Timestamp (Amsterdam)',
    'Wardrobe Size', 'Shopping Frequency', 'Disposal Habit', 'Primary Driver',
    'Persona', 'Completion Status', 'Social Value', 'Emotional Value', 'Functional Value', 'Inflow/Outflow Value',
    'Set Type', 'Garment Type', 'How Got', 'Cost',
    'Wear Frequency', 'Main Use', 'Main Use Other', 'Why Bought', 'Why Bought Other',
    'How Long Had', 'Why Favorite', 'Why Favorite Other',
    'Wash Frequency', 'Repaired', 'Why Not Wear', 'Why Not Wear Other', 'Disposal Plan', 'How Long Had (Years)'
  ];

  const rows = data.responses.map(r => buildResponseRow(data, r));

  return [headers, ...rows]
    .map(row => row.map(csvQuote).join(','))
    .join('\n');
}
