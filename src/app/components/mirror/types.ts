// All shared types for the Mirror feature.
// Behaviour: identical to the previous in-file definitions.

export interface SetAResponse {
  setType: 'A';
  garmentType: string;
  howGot: string;
  cost: string;
  wearFrequency: string;
  mainUse: string[];
  mainUseOther?: string;
  whyBought: string;
  whyBoughtOther?: string;
  timestamp: string;
}

export interface SetBResponse {
  setType: 'B';
  garmentType: string;
  whyFavorite?: string | string[];
  whyFavoriteOther?: string;
  howGot: string;
  cost: string;
  howLongHad: string;
  wearFrequency: string;
  mainUse: string[];
  mainUseOther?: string;
  washFrequency?: string;
  repaired?: string;
  timestamp: string;
}

export interface SetCResponse {
  setType: 'C';
  garmentType: string;
  howLongHad: string;
  cost: string;
  howGot: string;
  whyNotWear: string[];
  whyNotWearOther?: string;
  disposalPlan: string;
  timestamp: string;
}

export type SetResponse = SetAResponse | SetBResponse | SetCResponse;

export interface BaselineResponses {
  wardrobeSize: 'minimal' | 'moderate' | 'extensive';
  shoppingFrequency: 'rarely' | 'occasionally' | 'frequently';
  disposalHabit: 'rarely' | 'periodically' | 'regularly';
  primaryDriver: 'function' | 'emotion' | 'social';
}

export interface ValueMeters {
  social: number;
  emotional: number;
  functional: number;
  inflowOutflow: number;
}

export interface PersonaProfile {
  name: string;
  icon: string;
  tagline: string;
  poeticDescription: string;
  insight: string;
  researchProfile: {
    acquisitionDriver: string;
    retentionPattern: string;
    disposalTrigger: string;
    flowRate: 'low' | 'moderate' | 'high';
    primaryValue: string;
  };
}

export interface GameData {
  sessionId: string;
  timestamp: string;
  setsCompleted: number;
  baselineResponses?: BaselineResponses | null;
  values?: ValueMeters;
  persona?: string;
  responses: SetResponse[];
}

export type GameState = 'welcome' | 'baseline' | 'set-intro' | 'question' | 'set-complete' | 'final';
export type CurrentSet = 'A' | 'B' | 'C' | null;
export type ActiveSet = Exclude<CurrentSet, null>;
export type MotionPreference = boolean | null;

export interface QuestionStep {
  id: string;
  renderIndex: number;
  shouldShow?: (response: Partial<SetResponse>) => boolean;
}

export type SubmissionResult = { ok: true } | { ok: false; error: string };
