import { Card, CardRarity, CardAbility, BattleEffect } from '../types';

export const CARD_RARITY: Record<string, CardRarity> = {
  COMMON: { id: "common", label: "Common", color: "#778899", glow: "rgba(119,136,153,.25)", weight: 55 },
  UNCOMMON: { id: "uncommon", label: "Uncommon", color: "#0060A9", glow: "rgba(0,96,169,.3)", weight: 28 },
  RARE: { id: "rare", label: "Rare", color: "#7B2FBE", glow: "rgba(123,47,190,.35)", weight: 13 },
  LEGENDARY: { id: "legendary", label: "Legendary", color: "#c8a800", glow: "rgba(200,168,0,.45)", weight: 4 },
};

export const CARD_DROP = {
  easy: { common: 70, uncommon: 22, rare: 7, legendary: 1 },
  medium: { common: 55, uncommon: 28, rare: 13, legendary: 4 },
  hard: { common: 38, uncommon: 30, rare: 22, legendary: 10 },
  pro: { common: 22, uncommon: 30, rare: 30, legendary: 18 },
};

export const CARD_GAME_TYPE: Record<string, string> = {
  dc: "transit", pdx: "transit", balt: "transit", la: "transit",
  states: "geography", nfl: "sports"
};

export const CARD_TYPE_ADV: Record<string, { beats: string; bonus: number }> = {
  transit: { beats: "geography", bonus: 1.18 },
  geography: { beats: "sports", bonus: 1.18 },
  sports: { beats: "transit", bonus: 1.18 }
};

export function getRandomRarity(difficulty: keyof typeof CARD_DROP = 'medium'): string {
  const drop = CARD_DROP[difficulty];
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, chance] of Object.entries(drop)) {
    cumulative += chance;
    if (random <= cumulative) {
      return rarity;
    }
  }
  return 'common';
}

export function calculateCardPower(basePower: number, rarity: string): number {
  const rarityMultiplier = {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    legendary: 2
  };
  return Math.round(basePower * (rarityMultiplier[rarity as keyof typeof rarityMultiplier] || 1));
}

export function getCardRarityColor(rarity: string): string {
  return CARD_RARITY[rarity.toUpperCase()]?.color || '#778899';
}

export function getCardRarityGlow(rarity: string): string {
  return CARD_RARITY[rarity.toUpperCase()]?.glow || 'rgba(119,136,153,.25)';
}

export function formatCardPower(power: number): string {
  return power.toString();
}

export function hasAbility(card: Card): boolean {
  return !!card.ability;
}

export function isAbilityReady(card: Card, lastUsed: number | null): boolean {
  if (!card.ability) return false;
  if (!lastUsed) return true;
  
  const cooldownMs = card.ability.cooldownHours * 60 * 60 * 1000;
  return Date.now() - lastUsed >= cooldownMs;
}

export function getAbilityCooldownRemaining(card: Card, lastUsed: number | null): number {
  if (!card.ability || !lastUsed) return 0;
  
  const cooldownMs = card.ability.cooldownHours * 60 * 60 * 1000;
  const elapsed = Date.now() - lastUsed;
  const remaining = cooldownMs - elapsed;
  
  return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000))); // Return hours remaining
}