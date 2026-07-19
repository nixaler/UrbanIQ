const ADJECTIVES = ['Calm', 'Quiet', 'Gentle', 'Steady', 'Kind', 'Patient', 'Warm', 'Brave', 'Honest', 'Hopeful'];
const ANIMALS = ['Fox', 'Owl', 'Otter', 'Deer', 'Heron', 'Hare', 'Wren', 'Lynx', 'Finch', 'Seal'];

// Deterministic-looking but random pseudonym, e.g. "Calm Fox 213" — never
// derived from any real identity.
export function generatePseudonym(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${animal} ${suffix}`;
}
