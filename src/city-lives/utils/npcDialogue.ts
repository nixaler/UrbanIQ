import type { Citizen, Family } from '../types';

export interface NpcDialogueOption {
  label: string;
  reply: string;
}

export interface NpcDialogue {
  greeting: string;
  options: NpcDialogueOption[];
}

function eraGreeting(year: number): string {
  if (year < 1945) return 'Afternoon.';
  if (year < 1960) return 'Good to see you.';
  if (year < 1975) return 'Hey.';
  if (year < 1990) return "How's it going.";
  if (year < 2005) return 'What\'s up.';
  return 'Hey.';
}

function firstSentence(bio: string): string {
  return bio.split('.')[0].trim() + '.';
}

function neighborhoodLine(year: number): string {
  if (year < 1945) return 'These streets take care of their own — when times allow it.';
  if (year < 1960) return 'The neighborhood is changing. Slowly, but it is.';
  if (year < 1975) return "People are angry. You can feel it. I don't blame them.";
  if (year < 1990) return 'Everyone just trying to hold on to what they built.';
  if (year < 2005) return "Some folks made it out. Most of us are still here, figuring it out.";
  return 'The city keeps moving. Doesn\'t wait for anyone.';
}

export function getNpcDialogue(
  npc: Citizen,
  year: number,
  playerCitizen: Citizen,
  families: Family[],
): NpcDialogue {
  const sameFamily = npc.familyId !== null && npc.familyId === playerCitizen.familyId;
  const npcFamily = families.find(f => f.id === npc.familyId);
  const age = year - npc.birthYear;

  // Greeting varies by relationship and life stage
  let greeting: string;
  if (sameFamily) {
    greeting = `${npc.firstName}. ${firstSentence(npc.biography)}`;
  } else if (age < 18) {
    greeting = `${eraGreeting(year)} ${firstSentence(npc.biography)}`;
  } else if (age > 65) {
    greeting = `${firstSentence(npc.biography)} Been a long time since things were any different.`;
  } else {
    greeting = `${eraGreeting(year)} ${firstSentence(npc.biography)}`;
  }

  const options: NpcDialogueOption[] = [
    {
      label: "Tell me what's been on your mind.",
      reply: npc.biography.split('.').slice(0, 2).join('.').trim() + '.',
    },
    {
      label: sameFamily ? "How's the family holding up?" : "How's the neighborhood these days?",
      reply: sameFamily
        ? `The ${npcFamily?.familyName ?? 'family'} keeps moving. Some things don't change.`
        : neighborhoodLine(year),
    },
    {
      label: 'I should get going.',
      reply: age > 60
        ? `Take care of yourself. Time goes faster than you think.`
        : `Yeah. Come back around.`,
    },
  ];

  return { greeting, options };
}
