export interface Point { x: number; y: number; }

export type Role = 'QB' | 'RB' | 'FB' | 'WR' | 'TE';

export interface PlayerDef {
  id: string;
  role: Role;
  label: string;
  start: Point;
}

export interface Formation {
  key: string;
  name: string;
  emoji: string;
  desc: string;
  losY: number;
  qb: PlayerDef;
  eligible: PlayerDef[];
}

export interface DefenderDef {
  id: string;
  start: Point;
  markId: string | null;
}

export interface RouteTemplate {
  key: string;
  name: string;
  emoji: string;
  difficulty: number;
  build: (start: Point, losY: number) => Point[];
}

export interface SavedPlay {
  id: string;
  name: string;
  formationKey: string;
  routes: Record<string, Point[]>;
  targetId: string | null;
  createdAt: number;
}

export interface CareerStats {
  attempts: number;
  completions: number;
  touchdowns: number;
  bestYards: number;
}
