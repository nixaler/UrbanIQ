import type { Citizen, Decision, DecisionTemplate, LifeStage, Ripple, WorldSnapshot } from '../types';
import { DECISION_TEMPLATES } from '../data/decisions';

// ── DECISION ENGINE ───────────────────────────────────────────────────────────
// Generates decisions for a citizen in a given year by matching templates
// to the citizen's current state, and injecting ripple-triggered decisions.

export function generateDecisionsForYear(
  citizen: Citizen,
  year: number,
  worldSnapshot: WorldSnapshot,
  manifestingRipples: Ripple[],
  playthroughId: string
): Decision[] {
  const stage = getLifeStage(citizen, year);
  const decisions: Decision[] = [];

  // Evidence/family-specific decisions fire first if conditions met
  const specificDecisions = DECISION_TEMPLATES.filter(
    t => t.condition(citizen, worldSnapshot) &&
      t.lifeStages.includes(stage) &&
      (t.familySpecific === undefined || t.familySpecific === citizen.familyId?.split('')[0])
  );

  for (const template of specificDecisions) {
    if (decisions.length >= 3) break; // Cap per year
    decisions.push(templateToDecision(template, citizen, year, worldSnapshot, playthroughId));
  }

  // Ripple-triggered decisions: certain ripples inject a specific decision
  for (const ripple of manifestingRipples) {
    if (ripple.impactType === 'career_opportunity') {
      decisions.push(buildRippleTriggeredDecision(ripple, citizen, year, playthroughId));
    }
  }

  return decisions;
}

function templateToDecision(
  template: DecisionTemplate,
  citizen: Citizen,
  year: number,
  world: WorldSnapshot,
  playthroughId: string
): Decision {
  const contextText = template.contextTemplate
    .replace(/\{firstName\}/g, citizen.firstName)
    .replace(/\{lastName\}/g, citizen.lastName)
    .replace(/\{year\}/g, String(year));

  return {
    id: crypto.randomUUID(),
    worldId: '',
    playthroughId,
    citizenId: citizen.id,
    year,
    prompt: template.prompt,
    contextText,
    locationId: '',
    category: template.category,
    chosenOptionId: null,
    options: template.options.map(opt => ({ ...opt, id: crypto.randomUUID() })),
    triggeredByRippleId: null,
    isEvidenceDecision: template.isEvidenceDecision ?? false,
    createdAt: new Date().toISOString(),
  };
}

function buildRippleTriggeredDecision(
  ripple: Ripple,
  citizen: Citizen,
  year: number,
  playthroughId: string
): Decision {
  const sourceName = 'someone from this city\'s past';

  return {
    id: crypto.randomUUID(),
    worldId: '',
    playthroughId,
    citizenId: citizen.id,
    year,
    prompt: `An unexpected opportunity has arrived — one that traces back, though you don\'t yet know it, to a decision made by ${sourceName}.`,
    contextText: ripple.resolvedNarrative ?? ripple.narrativeTemplate,
    locationId: '',
    category: 'community_vs_ambition',
    chosenOptionId: null,
    options: [
      {
        id: crypto.randomUUID(),
        label: 'Take the opportunity',
        description: 'Step toward what\'s been offered.',
        outcomes: {
          wealthDelta: 10,
          reputationDelta: 15,
          relationshipEffects: [],
          narrativeResult: 'You take it. The door was opened by someone you\'ve never met. You walk through it.',
          rippleSeeds: [],
        },
      },
      {
        id: crypto.randomUUID(),
        label: 'Decline — this doesn\'t feel right',
        description: 'Trust the hesitation.',
        outcomes: {
          wealthDelta: 0,
          reputationDelta: 5,
          relationshipEffects: [],
          narrativeResult: 'You pass on it. Someone else takes it. Years later, you\'ll hear about them. You\'ll never be certain you were wrong.',
          rippleSeeds: [],
        },
      },
    ],
    triggeredByRippleId: ripple.id,
    isEvidenceDecision: false,
    createdAt: new Date().toISOString(),
  };
}

export function getLifeStage(citizen: Citizen, year: number): LifeStage {
  const age = year - citizen.birthYear;
  if (age < 13) return 'child';
  if (age < 25) return 'youth';
  if (age < 65) return 'adult';
  return 'elder';
}

export function getDecisionYearsForLife(citizen: Citizen): number[] {
  const startYear = citizen.birthYear + 18; // Decisions begin at adulthood
  const endYear = citizen.deathYear ?? citizen.birthYear + 75;
  const years: number[] = [];

  // Space decisions ~5-8 years apart
  let current = startYear;
  while (current <= endYear) {
    years.push(current);
    current += 5 + Math.floor(Math.random() * 4);
  }

  return years;
}
