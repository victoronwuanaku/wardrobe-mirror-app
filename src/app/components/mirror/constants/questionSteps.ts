import type { ActiveSet, QuestionStep, SetResponse } from '../types';

export const QUESTION_STEPS: Record<ActiveSet, QuestionStep[]> = {
  A: [
    { id: 'garmentType', renderIndex: 0 },
    { id: 'howGot', renderIndex: 1 },
    { id: 'cost', renderIndex: 2 },
    { id: 'wearFrequency', renderIndex: 3 },
    { id: 'mainUse', renderIndex: 4 },
    { id: 'whyBought', renderIndex: 5 },
  ],
  B: [
    { id: 'garmentType', renderIndex: 0 },
    { id: 'whyFavorite', renderIndex: 1 },
    { id: 'howGot', renderIndex: 2 },
    { id: 'cost', renderIndex: 3 },
    { id: 'howLongHad', renderIndex: 4 },
    { id: 'wearFrequency', renderIndex: 5 },
    { id: 'mainUse', renderIndex: 6 },
    { id: 'washFrequency', renderIndex: 8, optional: true },
    { id: 'repaired', renderIndex: 9, optional: true },
  ],
  C: [
    { id: 'garmentType', renderIndex: 0 },
    { id: 'howLongHad', renderIndex: 1 },
    { id: 'cost', renderIndex: 2 },
    { id: 'howGot', renderIndex: 3 },
    { id: 'whyNotWear', renderIndex: 4 },
    { id: 'disposalPlan', renderIndex: 5 },
  ],
};

export function getVisibleQuestionSteps(set: ActiveSet, response: Partial<SetResponse>): QuestionStep[] {
  return QUESTION_STEPS[set].filter((step) => !step.shouldShow || step.shouldShow(response));
}

export function getSetCategoryName(setType?: 'A' | 'B' | 'C'): string {
  switch (setType) {
    case 'A': return 'Recent Purchase';
    case 'B': return 'Favorite Garment';
    case 'C': return 'Disposal';
    default: return '';
  }
}
