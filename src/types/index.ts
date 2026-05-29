// Card System Types
export interface CardRarity {
  id: string;
  label: string;
  color: string;
  glow: string;
  weight: number;
}

export interface CardAbility {
  name: string;
  icon: string;
  description: string;
  type: 'hint' | 'battle' | 'boost';
  cooldownHours: number;
  battleEffect: BattleEffect;
}

export interface BattleEffect {
  type: string;
  value?: number;
  desc: string;
  min?: number;
  max?: number;
  rounds?: number[];
  threshold?: number;
  win?: number;
  lose?: number;
}

export interface Card {
  id: string;
  name: string;
  rarity: string;
  rarityId: string;
  cardType: 'transit' | 'geography' | 'sports';
  power: number;
  ability?: CardAbility;
  image?: string;
  city?: string;
}

export interface PlayerDeck {
  cards: Card[];
  playerId: string;
  playerName: string;
}

// Game Types
export type GameMode = 'dc' | 'pdx' | 'balt' | 'la' | 'states' | 'nfl';
export type GameType = 'transit' | 'geography' | 'sports';

export interface GameState {
  currentMode: GameMode;
  score: number;
  round: number;
  maxRounds: number;
  guesses: string[];
  targetAnswer: string;
  hints: string[];
  isComplete: boolean;
  startTime: number;
}

// Battle Types
export interface BattleRound {
  winner: 'a' | 'b';
  sA: number;
  sB: number;
  nameA: string;
  nameB: string;
  rarityA: string;
  rarityB: string;
}

export interface BattleRecord {
  battleId: string;
  playerId: string;
  playerName: string;
  deck: Card[];
  status: 'waiting' | 'resolved';
  result: 'win' | 'loss' | null;
  opponentId?: string;
  opponentName?: string;
  opponentDeck?: Card[];
  rounds?: BattleRound[];
  winsA?: number;
  winsB?: number;
  submittedAt: string;
  resolvedAt?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  games: number;
}

export interface BattleHistory {
  battleId: string;
  result: 'win' | 'loss';
  opponentName: string;
  resolvedAt: string;
  winsA: number;
  winsB: number;
}

// UI State Types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  currentView: 'home' | 'game' | 'battle' | 'collection' | 'leaderboard';
  showTutorial: boolean;
  settings: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
    theme: 'light' | 'dark';
  };
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface BattleSubmitResponse {
  battleId: string;
  status: 'waiting' | 'resolved';
  result?: 'win' | 'loss';
  record?: BattleRecord;
}

export interface HealthResponse {
  pvp: boolean;
  db: boolean;
}