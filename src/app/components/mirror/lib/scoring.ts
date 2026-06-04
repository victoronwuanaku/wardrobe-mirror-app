import type {
  BaselineResponses,
  PersonaProfile,
  SetAResponse,
  SetBResponse,
  SetCResponse,
  SetResponse,
  ValueMeters,
} from '../types';
import {
  scoreReflected,
  scoreExpectation,
  assignArchetype,
  calculateConfidenceLevel,
  type ConfidenceLevel,
} from './scoring-engine';
import type { ArchetypeKey } from './scoring-config';

export const clampValue = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Reflected (behaviour-only) value profile. The `baseline` parameter is retained for
 * call-site compatibility but no longer contributes to the behavioural score — baseline
 * is now the separate "expectation" profile (see calculateExpectationProfile).
 */
export function calculateValuesFromMirrorGame(
  responses: SetResponse[],
  _baseline?: BaselineResponses | null,
): ValueMeters {
  return scoreReflected(responses).values;
}

/** Expectation (self-image) profile, computed from baseline answers only. */
export function calculateExpectationProfile(baseline?: BaselineResponses | null): ValueMeters {
  return scoreExpectation(baseline).values;
}

/** Confidence in the reflected profile, graded by behavioural sets completed. */
export function calculateReflectionConfidence(responses: SetResponse[]): ConfidenceLevel {
  return calculateConfidenceLevel(responses.length);
}

const PERSONA_BUILDERS: Record<ArchetypeKey, (v: ValueMeters) => PersonaProfile> = {
  memoryKeeper: () => ({ name: 'The Memory Keeper', icon: '📖', tagline: 'Clothes as an archive of memory', poeticDescription: 'Your wardrobe carries stories. You keep garments because they hold people, phases of life, or moments you are not ready to flatten into simple utility.', insight: 'Meaning is a strength, but it can also make letting go harder than it needs to be.', researchProfile: { acquisitionDriver: 'Personal meaning, gifts, memories, and milestones', retentionPattern: 'Keeps items because they represent emotional chapters', disposalTrigger: 'Usually lets go only when space, condition, or life changes force a decision', flowRate: 'low', primaryValue: 'Emotional value' } }),
  socialChameleon: () => ({ name: 'The Social Chameleon', icon: '🦎', tagline: 'Clothing as social language', poeticDescription: 'You use clothing to adapt, express, and respond to context. Newness, occasions, style shifts, and identity signals matter in your wardrobe decisions.', insight: 'Your wardrobe is responsive and expressive. The key question is whether it reflects your own change, or pressure from outside.', researchProfile: { acquisitionDriver: 'Style, trends, social events, and identity expression', retentionPattern: 'Keeps items while they feel socially or stylistically relevant', disposalTrigger: 'Lets go when items feel outdated, unlike you, or no longer suitable for public use', flowRate: 'high', primaryValue: 'Social value' } }),
  functionalMinimalist: (v) => ({ name: 'The Functional Minimalist', icon: '⚙️', tagline: 'Purpose earns wardrobe space', poeticDescription: 'Your choices are grounded in use. Garments matter when they are comfortable, reliable, repairable, and useful in real life.', insight: 'Your clarity keeps the wardrobe practical. Just remember that usefulness can include pleasure and self-expression too.', researchProfile: { acquisitionDriver: 'Need, replacement, comfort, durability, and practical use', retentionPattern: 'Keeps garments that are worn often or perform a clear role', disposalTrigger: 'Lets go when an item no longer fits, works, or serves daily life', flowRate: v.inflowOutflow > 60 ? 'moderate' : 'low', primaryValue: 'Functional value' } }),
  consciousCurator: () => ({ name: 'The Conscious Curator', icon: '🌱', tagline: 'Aware of the garment lifecycle', poeticDescription: 'You notice movement in and out of the wardrobe. Your answers suggest attention to circulation, repair, resale, donation, or planned letting go.', insight: 'You are aware of clothing as a lifecycle, not just a purchase. The challenge is to make that flow intentional rather than reactive.', researchProfile: { acquisitionDriver: 'Mixture of need, opportunity, and lifecycle awareness', retentionPattern: 'Keeps items while they still have use, value, or a possible second life', disposalTrigger: 'Uses donation, resale, bins, or repurposing when an item no longer belongs', flowRate: 'high', primaryValue: 'Inflow/outflow awareness' } }),
  identityCollector: () => ({ name: 'The Identity Collector', icon: '✨', tagline: 'Wardrobe as autobiography', poeticDescription: 'Your clothing connects memory with identity. Items may represent who you were, who you are, or who you still imagine becoming.', insight: 'Your wardrobe tells a rich story. It may help to ask which chapters still need physical space.', researchProfile: { acquisitionDriver: 'Identity, aspiration, occasions, and emotional resonance', retentionPattern: 'Keeps garments that represent versions of self', disposalTrigger: 'Lets go when identity shifts or the item loses emotional/social relevance', flowRate: 'moderate', primaryValue: 'Identity and emotional-social meaning' } }),
  balancedAdapter: () => ({ name: 'The Balanced Adapter', icon: '⚖️', tagline: 'Flexible, contextual, practical', poeticDescription: 'Your wardrobe decisions are mixed and contextual. You seem to balance use, feeling, appearance, and lifecycle rather than following one dominant rule.', insight: 'Balance is useful because real wardrobes are messy. Your opportunity is to make your implicit rules more visible.', researchProfile: { acquisitionDriver: 'Context, need, preference, and occasion', retentionPattern: 'Keeps items when they remain useful, meaningful, or socially fitting', disposalTrigger: 'Lets go when enough reasons accumulate across fit, taste, use, or condition', flowRate: 'moderate', primaryValue: 'Balanced value mix' } }),
};

export function calculatePersona(values: ValueMeters): PersonaProfile {
  return PERSONA_BUILDERS[assignArchetype(values)](values);
}

export function getMirrorInsights(responses: SetResponse[], baseline: BaselineResponses | null, persona: PersonaProfile) {
  const purchase = responses.find(r => r.setType === 'A') as SetAResponse | undefined;
  const favorite = responses.find(r => r.setType === 'B') as SetBResponse | undefined;
  const lettingGo = responses.find(r => r.setType === 'C') as SetCResponse | undefined;
  const insights = [];
  if (baseline) insights.push({ title: 'Your stated driver', text: `You began by saying your main clothing driver is ${baseline.primaryDriver}. The reflection compares that self-view with your concrete garment stories.` });
  if (purchase) {
    const motive = purchase.whyBought === 'replace-similar' ? 'replacement and practical need' : purchase.whyBought === 'wanted-new' ? 'newness, style, or identity change' : purchase.whyBought === 'on-sale' ? 'opportunity and price sensitivity' : 'a personal reason';
    insights.push({ title: 'Recent purchase signal', text: `Your recent purchase points toward ${motive}. This helps explain what brings new items into your wardrobe.` });
  }
  if (favorite) {
    const repair = favorite.repaired && !['no', 'skipped'].includes(favorite.repaired) ? 'You show some willingness to maintain or repair valued clothing.' : 'Your favorite item seems to be valued more through use or meaning than through active repair.';
    insights.push({ title: 'Retention signal', text: `${repair} Favorite garments reveal why some items stay.` });
  }
  if (lettingGo) {
    const plan = lettingGo.disposalPlan === 'repair-repurpose' ? 'repairing or repurposing' : lettingGo.disposalPlan === 'sell-it' ? 'selling' : lettingGo.disposalPlan === 'textile-bins' ? 'textile collection' : lettingGo.disposalPlan === 'donate-charity' ? 'donating' : 'passing it to someone else';
    insights.push({ title: 'Letting-go signal', text: `Your outflow choice leans toward ${plan}. This shows how you imagine value continuing after you stop wearing an item.` });
  }
  insights.push({ title: 'Behavioural archetype', text: `${persona.name}: ${persona.insight}` });
  return insights.slice(0, 4);
}
