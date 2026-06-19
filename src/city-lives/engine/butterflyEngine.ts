import type {
  Citizen, Decision, DecisionOption, Playthrough, Ripple,
  RippleImpact, RippleSeed, World, WorldSnapshot,
} from '../types';
import { CITIZENS } from '../data/families';

// ── BUTTERFLY ENGINE ──────────────────────────────────────────────────────────
// Resolves decisions into ripple effects and applies them to target citizens.

export function processDecision(
  decision: Decision,
  chosenOption: DecisionOption,
  citizen: Citizen,
  world: World,
  allCitizens: Citizen[]
): Ripple[] {
  const ripples: Ripple[] = [];

  for (const seed of chosenOption.outcomes.rippleSeeds) {
    const targetId = resolveTargetId(seed.targetCitizenId, citizen, allCitizens, world);
    if (!targetId) continue;

    const manifestYear = decision.year + seed.delayYears;
    const narrative = fillNarrativeTemplate(
      seed.narrativeTemplate,
      citizen.firstName + ' ' + citizen.lastName,
      getCitizenName(targetId, allCitizens)
    );

    const ripple: Ripple = {
      id: crypto.randomUUID(),
      worldId: world.id,
      sourceCitizenId: citizen.id,
      sourceDecisionId: decision.id,
      sourceOptionId: chosenOption.id,
      targetCitizenId: targetId,
      manifestYear,
      impactType: seed.impactType,
      impactMagnitude: seed.impactMagnitude,
      narrativeTemplate: seed.narrativeTemplate,
      resolvedNarrative: narrative,
      isRevealed: false,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedYear: null,
      evidenceKey: seed.evidenceKey,
    };

    ripples.push(ripple);
  }

  return ripples;
}

export function resolveRipplesForYear(
  citizenId: string,
  year: number,
  pendingRipples: Ripple[]
): Ripple[] {
  return pendingRipples.filter(
    r => r.targetCitizenId === citizenId && r.manifestYear === year && !r.isRevealed
  );
}

export function applyRippleToState(
  ripple: Ripple,
  citizen: Citizen
): Partial<Citizen> {
  const updates: Partial<Citizen> = {};

  switch (ripple.impactType) {
    case 'wealth_windfall':
      updates.wealthTier = Math.min(4, citizen.wealthTier + 1) as Citizen['wealthTier'];
      break;
    case 'wealth_loss':
      updates.wealthTier = Math.max(0, citizen.wealthTier - 1) as Citizen['wealthTier'];
      break;
    case 'reputation_boost':
      updates.reputationScore = Math.min(100, citizen.reputationScore + Math.abs(ripple.impactMagnitude) / 2);
      break;
    case 'reputation_damage':
      updates.reputationScore = Math.max(-100, citizen.reputationScore - Math.abs(ripple.impactMagnitude) / 2);
      break;
    case 'career_setback':
      if (citizen.currentCareer) {
        updates.currentCareer = {
          ...citizen.currentCareer,
          salary: Math.max(0, citizen.currentCareer.salary * 0.7),
        };
      }
      break;
    default:
      break;
  }

  return updates;
}

export function buildWorldSnapshot(
  world: World,
  allCitizens: Citizen[],
  completedPlaythroughIds: string[],
  collectedEvidence: string[]
): WorldSnapshot {
  const districtWealth: Record<string, 0 | 1 | 2 | 3 | 4> = {};
  const activeBusinesses: string[] = [];

  return {
    currentYear: world.currentYear,
    districtWealth,
    activeBusinesses,
    completedPlaythroughIds,
    collectedEvidence: collectedEvidence as WorldSnapshot['collectedEvidence'],
  };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function resolveTargetId(
  targetExpression: string,
  sourceCitizen: Citizen,
  allCitizens: Citizen[],
  world: World
): string | null {
  if (targetExpression === 'nearest_family') {
    const familyMembers = allCitizens.filter(
      c => c.familyId === sourceCitizen.familyId && c.id !== sourceCitizen.id && c.status !== 'deceased'
    );
    if (familyMembers.length === 0) return null;
    return familyMembers[Math.floor(Math.random() * familyMembers.length)].id;
  }

  if (targetExpression === 'nearest_colleague') {
    const sameDistrict = allCitizens.filter(
      c => c.districtId === sourceCitizen.districtId && c.id !== sourceCitizen.id && c.status !== 'deceased'
    );
    if (sameDistrict.length === 0) return null;
    return sameDistrict[Math.floor(Math.random() * sameDistrict.length)].id;
  }

  const citizen = allCitizens.find(c => c.id === targetExpression);
  return citizen ? citizen.id : null;
}

function getCitizenName(citizenId: string, allCitizens: Citizen[]): string {
  const citizen = allCitizens.find(c => c.id === citizenId);
  if (!citizen) return 'someone';
  return citizen.firstName + ' ' + citizen.lastName;
}

function fillNarrativeTemplate(template: string, sourceName: string, targetName: string): string {
  return template
    .replace(/\{sourceName\}/g, sourceName)
    .replace(/\{targetName\}/g, targetName);
}

export function generateLegacyNote(citizen: Citizen, playthrough: Playthrough, decisions: Decision[]): string {
  const deathYear = citizen.deathYear ?? playthrough.yearDied ?? playthrough.currentYear;
  const age = deathYear - citizen.birthYear;
  const rippleCount = playthrough.ripplesGenerated;
  const fullName = `${citizen.firstName} ${citizen.lastName}`;

  const careerLine = citizen.currentCareer
    ? `${citizen.currentCareer.title.toLowerCase()}`
    : 'resident of Crestfield';

  const rippleLine = rippleCount > 3
    ? `Their choices echoed into ${rippleCount} other lives in ways they never fully knew.`
    : rippleCount > 0
    ? `At least one decision they made found its way into someone else\'s story.`
    : `They moved through this city quietly, leaving fewer visible marks than most.`;

  const wealthNote =
    citizen.wealthTier <= 1
      ? 'They did not have much, and they gave what they could.'
      : citizen.wealthTier >= 3
      ? 'They had more than most. What they did with it is part of the record.'
      : 'They built something from what they were given.';

  return `${fullName} was born in ${citizen.birthYear} and died in ${deathYear}, at ${age}. ${fullName.split(' ')[0]} worked as a ${careerLine}. ${wealthNote}

${rippleLine}

The city remembers everyone differently. Crestfield will remember ${fullName.split(' ')[0]} as part of the longer story — the one that\'s still being told.`;
}
