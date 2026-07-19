import type { SavedPlay, CareerStats } from './types';

const PLAYBOOK_KEY = 'tgg:playcaller:playbook';
const CAREER_KEY = 'tgg:playcaller:career';

export function loadPlaybook(): SavedPlay[] {
  try {
    const raw = localStorage.getItem(PLAYBOOK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlaybook(plays: SavedPlay[]): void {
  try {
    localStorage.setItem(PLAYBOOK_KEY, JSON.stringify(plays));
  } catch {}
}

export function loadCareer(): CareerStats {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempts: 0, completions: 0, touchdowns: 0, bestYards: 0 };
}

export function saveCareer(stats: CareerStats): void {
  try {
    localStorage.setItem(CAREER_KEY, JSON.stringify(stats));
  } catch {}
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function vibrate(ms: number): void {
  try {
    if ('vibrate' in navigator) (navigator as any).vibrate(ms);
  } catch {}
}
