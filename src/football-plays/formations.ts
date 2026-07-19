import type { Point, Formation, RouteTemplate, DefenderDef } from './types';

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Constant-speed interpolation along a polyline, t in [0,1].
export function pointAtT(waypoints: Point[], t: number): Point {
  if (waypoints.length === 0) return { x: 50, y: 50 };
  if (waypoints.length === 1) return waypoints[0];
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = dist(waypoints[i], waypoints[i + 1]);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return waypoints[waypoints.length - 1];
  let target = clamp(t, 0, 1) * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const segT = segLens[i] === 0 ? 0 : Math.min(1, target / segLens[i]);
      return lerp(waypoints[i], waypoints[i + 1], segT);
    }
    target -= segLens[i];
  }
  return waypoints[waypoints.length - 1];
}

export const FORMATIONS: Formation[] = [
  {
    key: 'pro-i',
    name: 'Pro Set I',
    emoji: '🏈',
    desc: 'Classic power run & play-action look',
    losY: 68,
    qb: { id: 'qb', role: 'QB', label: 'QB', start: { x: 50, y: 71 } },
    eligible: [
      { id: 'rb', role: 'RB', label: 'RB', start: { x: 50, y: 80 } },
      { id: 'wrL', role: 'WR', label: 'WR', start: { x: 8, y: 66 } },
      { id: 'te', role: 'TE', label: 'TE', start: { x: 66, y: 66 } },
      { id: 'wrR', role: 'WR', label: 'WR', start: { x: 92, y: 66 } },
    ],
  },
  {
    key: 'shotgun',
    name: 'Shotgun Spread',
    emoji: '🎯',
    desc: 'Four wide, QB in the gun',
    losY: 68,
    qb: { id: 'qb', role: 'QB', label: 'QB', start: { x: 50, y: 80 } },
    eligible: [
      { id: 'rb', role: 'RB', label: 'RB', start: { x: 38, y: 79 } },
      { id: 'wrL', role: 'WR', label: 'WR', start: { x: 6, y: 66 } },
      { id: 'slotR', role: 'WR', label: 'SLOT', start: { x: 78, y: 67 } },
      { id: 'wrR', role: 'WR', label: 'WR', start: { x: 94, y: 66 } },
    ],
  },
  {
    key: 'trips',
    name: 'Trips Right',
    emoji: '🔀',
    desc: 'Overload the right side, iso left',
    losY: 68,
    qb: { id: 'qb', role: 'QB', label: 'QB', start: { x: 50, y: 71 } },
    eligible: [
      { id: 'rb', role: 'RB', label: 'RB', start: { x: 50, y: 80 } },
      { id: 'wrL', role: 'WR', label: 'WR', start: { x: 8, y: 66 } },
      { id: 'slotR', role: 'WR', label: 'SLOT', start: { x: 80, y: 67 } },
      { id: 'wrR', role: 'WR', label: 'WR', start: { x: 95, y: 65 } },
    ],
  },
  {
    key: 'goalline',
    name: 'Goal Line',
    emoji: '🥅',
    desc: 'Punch it in from the 5',
    losY: 22,
    qb: { id: 'qb', role: 'QB', label: 'QB', start: { x: 50, y: 25 } },
    eligible: [
      { id: 'fb', role: 'FB', label: 'FB', start: { x: 50, y: 30 } },
      { id: 'teL', role: 'TE', label: 'TE', start: { x: 30, y: 21 } },
      { id: 'teR', role: 'TE', label: 'TE', start: { x: 70, y: 21 } },
      { id: 'wr', role: 'WR', label: 'WR', start: { x: 90, y: 20 } },
    ],
  },
];

export function getFormation(key: string): Formation {
  return FORMATIONS.find(f => f.key === key) || FORMATIONS[0];
}

export const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    key: 'go',
    name: 'Go',
    emoji: '🚀',
    difficulty: 0.7,
    build: (start) => [start, { x: start.x, y: Math.max(9, start.y - 55) }],
  },
  {
    key: 'slant',
    name: 'Slant',
    emoji: '↘️',
    difficulty: 0.15,
    build: (start) => {
      const dx = start.x < 50 ? 16 : -16;
      return [start, { x: start.x + dx * 0.4, y: start.y - 6 }, { x: clamp(start.x + dx, 4, 96), y: start.y - 14 }];
    },
  },
  {
    key: 'out',
    name: 'Out',
    emoji: '↗️',
    difficulty: 0.35,
    build: (start) => {
      const outward = start.x < 50 ? -1 : 1;
      return [
        start,
        { x: start.x, y: start.y - 16 },
        { x: clamp(start.x + outward * 30, 6, 94), y: start.y - 17 },
      ];
    },
  },
  {
    key: 'curl',
    name: 'Curl',
    emoji: '🪝',
    difficulty: 0.2,
    build: (start) => {
      const inward = start.x < 50 ? 4 : -4;
      return [start, { x: start.x, y: start.y - 20 }, { x: start.x + inward, y: start.y - 14 }];
    },
  },
  {
    key: 'post',
    name: 'Post',
    emoji: '📯',
    difficulty: 0.55,
    build: (start) => {
      return [
        start,
        { x: start.x, y: start.y - 22 },
        { x: start.x + (50 - start.x) * 0.7, y: Math.max(9, start.y - 42) },
      ];
    },
  },
  {
    key: 'screen',
    name: 'Screen',
    emoji: '🛡️',
    difficulty: 0.05,
    build: (start) => {
      const inward = start.x < 50 ? 12 : -12;
      return [start, { x: start.x + inward, y: Math.min(96, start.y + 4) }];
    },
  },
];

let seedCounter = 1;
function rand(): number {
  // simple deterministic-ish PRNG so re-shuffles feel different each tap
  seedCounter = (seedCounter * 9301 + 49297) % 233280;
  return seedCounter / 233280;
}

export function generateDefense(formation: Formation): DefenderDef[] {
  const defenders: DefenderDef[] = formation.eligible.map((p, i) => ({
    id: `def-${p.id}`,
    markId: p.id,
    start: {
      x: clamp(p.start.x + (rand() - 0.5) * 10, 2, 98),
      y: clamp(p.start.y - 8 - rand() * 6, 2, 98),
    },
  }));
  defenders.push({
    id: 'def-safety',
    markId: null,
    start: {
      x: clamp(50 + (rand() - 0.5) * 24, 8, 92),
      y: clamp(formation.losY - 34, 2, formation.losY - 10),
    },
  });
  return defenders;
}
