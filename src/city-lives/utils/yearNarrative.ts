import type { Citizen, Decision } from '../types';
import type { CareerSnapshot } from '../types';
import { HISTORICAL_EVENTS } from '../data/crestfield';
import { getLifeStage } from '../engine/decisionEngine';

// ── OPENING SENTENCE ──────────────────────────────────────────────────────────

function openingSentence(firstName: string, age: number, stage: string, career: CareerSnapshot | null): string {
  const careerPhrase = career ? `working as ${career.title.toLowerCase()}` : 'between jobs';

  if (stage === 'child') {
    if (age < 5)  return `${firstName} is ${age} years old — the world is still just home, family, and the sounds of the block.`;
    if (age < 10) return `${firstName} is ${age}, still young enough that the city is just a backdrop to school and the neighborhood.`;
    return `${firstName} is ${age}. Old enough now to notice things — the conversations that stop when kids walk in, the weight behind certain silences.`;
  }
  if (stage === 'youth') {
    if (age < 18) return `${firstName} is ${age}, ${careerPhrase}, figuring out who they are against the backdrop of this city.`;
    return `${firstName} is ${age} — ${careerPhrase}, and starting to understand what it actually costs to live the way they want to.`;
  }
  if (stage === 'adult') {
    if (age < 40) return `${firstName} is ${age}. ${careerPhrase[0].toUpperCase() + careerPhrase.slice(1)}. The city is familiar now in the way that only years can make it.`;
    if (age < 55) return `${firstName} is ${age}. They've been ${careerPhrase} long enough to know what stays and what changes.`;
    return `${firstName} is ${age} — ${careerPhrase}. The city has changed around them more than once. They've changed too.`;
  }
  // elder
  if (age < 75) return `${firstName} is ${age}. Still ${careerPhrase}, though the pace has slowed. They've earned the right to take stock.`;
  return `${firstName} is ${age}. They have watched this city change in ways they couldn't have imagined when they were young.`;
}

// ── DISTRICT SENTENCE ─────────────────────────────────────────────────────────

function districtSentence(districtId: string, year: number): string | null {
  switch (districtId) {
    case 'westside':
      if (year < 1965) return 'Westside is alive — corner stores, music bleeding from bar windows, a neighborhood that knows itself.';
      if (year < 1971) return 'Westside still hums, but the talk on the stoops has gotten harder. People are watching what the city is planning.';
      if (year < 1973) return 'The demolition notices are on the telephone poles now. Westside holds itself differently — quieter, watchful.';
      return 'Westgate Tower stands where the old block used to be. The street names are the same. Nothing else is.';
    case 'westside_remnant':
      if (year < 2023) return 'New Westside is smaller than what came before, but still here. Still itself.';
      return 'The development signs are up on the corner. The neighborhood watches and waits.';
    case 'portside':
      if (year < 1945) return 'The port is busy — men on the docks before sunrise, ships moving in and out with the tide.';
      if (year < 1975) return 'The port still runs. Shifts change. The neighborhood built around it shifts with them.';
      return 'The port is quieter than it was. Containerization changed everything. The neighborhood felt that.';
    case 'heights':
      return 'The Heights stays the same regardless of what happens below — tree-lined streets, long driveways, the kind of quiet that money buys.';
    case 'midtown':
      return 'Midtown moves fast. Everyone passes through here sooner or later.';
    case 'eastflats':
      if (year < 1974) return 'East Flats is working-class and close-knit. Not Westside, but a neighborhood.';
      return 'East Flats carries the weight of everyone who was pushed here from somewhere else. It holds that weight carefully.';
    default:
      return null;
  }
}

// ── HISTORICAL EVENT SENTENCE ─────────────────────────────────────────────────

function eventSentence(citizen: Citizen, year: number): string | null {
  const event = HISTORICAL_EVENTS.find(e => e.year === year);
  if (!event) return null;

  const affected = event.affectedDistrictIds.includes(citizen.districtId);
  if (affected) {
    // More personal version
    return event.description;
  }
  // Indirect version
  const headlines: Record<string, string> = {
    'The Great Depression Hits Crestfield': 'The news from the port is bad. The whole city is feeling it.',
    'The War Economy': 'The war has reached Crestfield. The port is working again. Everything else has changed.',
    'City Plans Interstate Through Portside': 'The city is moving people again, somewhere not far from here.',
    'Civil Rights March on City Hall': 'There was a march downtown today. Two thousand people. The mayor refused to meet with them.',
    'The Mayoral Election': 'Harold Birch won the mayor\'s race. The Caldwells celebrated. Most of the city shrugged.',
    'Sofia Morozov Disappears': 'There\'s talk in the neighborhood — the woman from the community center hasn\'t been seen.',
    'Westside Demolished': 'The old Westside is gone now. Three hundred and forty families. The city called it urban renewal.',
    'Westgate Tower Opens': 'The ribbon-cutting was in the paper today. The Courier called it a new era. No mention of what stood there before.',
    'The Crestfield Unrest': 'Three nights of protests in East Flats. The National Guard came. No charges filed.',
    'The Financial Crisis': 'The crash hit hard. East Flats worst of all. The Caldwells lost something, then recovered.',
    'Protests After the Crestfield Police Incident': 'Weeks of demonstrations downtown. Marcus Webb was photographed at both sides.',
    'The New Westside Development Vote': 'The Caldwell firm is proposing to demolish what\'s left of New Westside. The vote is in November.',
  };
  return headlines[event.title] || event.description;
}

// ── MAIN FUNCTION ─────────────────────────────────────────────────────────────

export function getYearNarrative(
  citizen: Citizen,
  year: number,
  completedDecisions: Decision[],
): string {
  const age = year - citizen.birthYear;
  const stage = getLifeStage(citizen, year);

  const parts: string[] = [];

  parts.push(openingSentence(citizen.firstName, age, stage, citizen.currentCareer));

  const evtSentence = eventSentence(citizen, year);
  const distSentence = districtSentence(citizen.districtId, year);

  if (evtSentence) {
    parts.push(evtSentence);
  } else if (distSentence) {
    parts.push(distSentence);
  }

  // Reference a recent decision outcome
  const recentDecision = completedDecisions
    .filter(d => d.chosenOptionId && d.year >= year - 2 && d.year < year)
    .sort((a, b) => b.year - a.year)[0];

  if (recentDecision) {
    const option = recentDecision.options.find(o => o.id === recentDecision.chosenOptionId);
    if (option) {
      parts.push(`The weight of the choice about ${option.label.toLowerCase()} hasn't left them.`);
    }
  }

  return parts.join(' ');
}
