import type {
  CompletePlaythroughResponse, CreateWorldResponse, MakeDecisionResponse,
  NewsHeadline, Playthrough, StartPlaythroughResponse, VoteOutcome,
  WestsideFilesState, World,
} from '../types';

// ── API WRAPPER ───────────────────────────────────────────────────────────────
// All calls to /api/city-lives/* with the existing auth token pattern.

function getAuthToken(): string | null {
  return localStorage.getItem('tgg:auth-token');
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`/api/city-lives${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── WORLD ─────────────────────────────────────────────────────────────────────

export function createWorld(name: string): Promise<CreateWorldResponse> {
  return api('POST', '/worlds', { name });
}

export function listWorlds(): Promise<World[]> {
  return api('GET', '/worlds');
}

export function getWorld(worldId: string): Promise<CreateWorldResponse> {
  return api('GET', `/worlds/${worldId}`);
}

export function joinWorld(shareCode: string): Promise<CreateWorldResponse> {
  return api('POST', '/worlds/join', { shareCode });
}

export function makeWorldPublic(worldId: string, isPublic: boolean): Promise<World> {
  return api('PATCH', `/worlds/${worldId}/visibility`, { isPublic });
}

// ── PLAYTHROUGHS ──────────────────────────────────────────────────────────────

export function startPlaythrough(worldId: string, citizenId: string): Promise<StartPlaythroughResponse> {
  return api('POST', '/playthroughs', { worldId, citizenId });
}

export function getPlaythrough(playthroughId: string): Promise<Playthrough> {
  return api('GET', `/playthroughs/${playthroughId}`);
}

export function completePlaythrough(playthroughId: string): Promise<CompletePlaythroughResponse> {
  return api('PATCH', `/playthroughs/${playthroughId}/complete`);
}

// ── DECISIONS ─────────────────────────────────────────────────────────────────

export function makeDecision(
  decisionId: string,
  optionId: string,
  playthroughId: string
): Promise<MakeDecisionResponse> {
  return api('POST', '/decisions', { decisionId, optionId, playthroughId });
}

// ── WESTSIDE FILES ────────────────────────────────────────────────────────────

export function getWestsideFiles(worldId: string): Promise<WestsideFilesState> {
  return api('GET', `/worlds/${worldId}/westside-files`);
}

// ── VOTE ─────────────────────────────────────────────────────────────────────

export function getVoteStatus(worldId: string): Promise<VoteOutcome> {
  return api('GET', `/worlds/${worldId}/vote`);
}

// ── NEWSPAPER ────────────────────────────────────────────────────────────────

export function getNewspaper(worldId: string, year?: number): Promise<NewsHeadline[]> {
  const query = year ? `?year=${year}` : '';
  return api('GET', `/worlds/${worldId}/newspaper${query}`);
}

// ── CITY GRAPH ────────────────────────────────────────────────────────────────

export function getRippleGraph(worldId: string): Promise<{
  nodes: Array<{ id: string; name: string; familyId: string; isPlayed: boolean }>;
  edges: Array<{ from: string; to: string; year: number; isRevealed: boolean; decisionKey: string }>;
}> {
  return api('GET', `/worlds/${worldId}/graph`);
}
