// ─── CITY LIVES — TYPE DEFINITIONS ───────────────────────────────────────────

// ── CITIZEN ──────────────────────────────────────────────────────────────────

export type CitizenStatus = 'alive' | 'deceased' | 'departed';
export type LifeStage = 'child' | 'youth' | 'adult' | 'elder';
export type WealthTier = 0 | 1 | 2 | 3 | 4; // 0=destitute, 4=wealthy

export interface Citizen {
  id: string;
  worldId: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  deathYear: number | null;
  causeOfDeath: string | null;
  status: CitizenStatus;
  traitIds: CitizenTrait[];
  districtId: string;
  familyId: string | null;
  currentCareer: CareerSnapshot | null;
  wealthTier: WealthTier;
  reputationScore: number; // -100 to 100
  isPlayable: boolean;
  playthroughId: string | null;
  biography: string; // Short flavor text for character select
  portraitKey: string; // Maps to portrait image/illustration
}

export type CitizenTrait =
  | 'ambitious' | 'loyal' | 'reckless' | 'generous' | 'cautious'
  | 'charismatic' | 'stubborn' | 'idealistic' | 'pragmatic' | 'artistic'
  | 'devout' | 'skeptical' | 'introverted' | 'resilient' | 'volatile'
  | 'curious' | 'empathetic' | 'disciplined' | 'creative' | 'principled';

// ── FAMILY ───────────────────────────────────────────────────────────────────

export interface Family {
  id: string;
  familyName: string;
  archetype: FamilyArchetype;
  foundedYear: number;
  memberIds: string[];
  currentWealthTier: WealthTier;
  reputationScore: number;
  secretUnlocked: boolean;
  secretRequiredPlaythroughs: number;
  secretTitle: string;
  secretText: string;
  colorTheme: string; // CSS hex color for UI accents
  tagline: string; // Short family description
}

export type FamilyArchetype =
  | 'founders' | 'builders' | 'keepers' | 'soul' | 'pragmatists' | 'witnesses';

// ── CAREER ───────────────────────────────────────────────────────────────────

export interface CareerSnapshot {
  title: string;
  employerId: string | null;
  salary: number;
  startYear: number;
}

// ── ASSET ────────────────────────────────────────────────────────────────────

export type AssetType = 'home' | 'business' | 'investment' | 'heirloom';

export interface Asset {
  id: string;
  worldId: string;
  type: AssetType;
  name: string;
  districtId: string;
  ownerId: string;
  originalOwnerId: string;
  value: number;
  yearAcquired: number;
  historyLog: string[];
}

// ── BUSINESS ─────────────────────────────────────────────────────────────────

export type BusinessStatus = 'active' | 'struggling' | 'closed' | 'thriving';

export interface Business {
  id: string;
  worldId: string;
  name: string;
  type: string;
  foundedYear: number;
  founderId: string;
  currentOwnerId: string;
  status: BusinessStatus;
  employeeIds: string[];
  districtId: string;
}

// ── DISTRICT ─────────────────────────────────────────────────────────────────

export interface District {
  id: string;
  name: string;
  character: 'residential' | 'commercial' | 'industrial' | 'mixed';
  wealthTier: WealthTier;
  description: string;
  historicalNotes: string[];
  connectedDistrictIds: string[];
}

// ── LOCATION (sub-district, visitable during gameplay) ────────────────────────

export type LocationType =
  | 'home' | 'workplace' | 'neighborhood' | 'power_center' | 'meeting_place' | 'cultural';

export interface Location {
  id: string;
  districtId: string;
  name: string;
  type: LocationType;
  description: string;
  activeYearStart: number;
  activeYearEnd: number | null; // null = still exists
  replacedByLocationId: string | null; // What it became (e.g., community center → construction site)
  ambientSound: string; // Sound key
  presentNpcIds: string[]; // Citizens who frequent this location
}

// ── RELATIONSHIP ──────────────────────────────────────────────────────────────

export type RelationshipType =
  | 'parent' | 'child' | 'sibling' | 'spouse' | 'ex_spouse' | 'family'
  | 'friend' | 'rival' | 'enemy' | 'mentor' | 'employee' | 'employer' | 'acquaintance'
  | 'colleague' | 'neighbor' | 'patron';

export interface Relationship {
  id: string;
  worldId: string;
  citizenAId: string;
  citizenBId: string;
  type: RelationshipType;
  strength: number; // 0-100
  formedYear: number;
  dissolvedYear: number | null;
  dissolvedReason: string | null;
}

// ── DECISION & BUTTERFLY EFFECT ──────────────────────────────────────────────

export type DecisionCategory =
  | 'loyalty_vs_integrity'
  | 'community_vs_ambition'
  | 'truth_vs_protection'
  | 'complicity_vs_consequence'
  | 'forgiveness_vs_accountability'
  | 'survival_vs_solidarity';

export type RippleImpact =
  | 'career_opportunity' | 'career_setback'
  | 'wealth_windfall' | 'wealth_loss'
  | 'relationship_formed' | 'relationship_damaged'
  | 'health_event' | 'housing_change'
  | 'reputation_boost' | 'reputation_damage'
  | 'family_event' | 'district_shift'
  | 'evidence_revealed'; // Special: unlocks a Westside Files evidence piece

export interface RippleSeed {
  targetCitizenId: string;
  delayYears: number;
  impactType: RippleImpact;
  impactMagnitude: number; // -100 to 100
  narrativeTemplate: string; // Uses {sourceName} and {targetName} tokens
  evidenceKey?: WestsideEvidenceKey; // If this ripple reveals evidence
}

export interface Ripple {
  id: string;
  worldId: string;
  sourceCitizenId: string;
  sourceDecisionId: string;
  sourceOptionId: string;
  targetCitizenId: string;
  manifestYear: number;
  impactType: RippleImpact;
  impactMagnitude: number;
  narrativeTemplate: string;
  resolvedNarrative: string | null; // Template filled in after reveal
  isRevealed: boolean;
  createdAt: string;
  resolvedAt: string | null;
  resolvedYear: number | null;
  evidenceKey?: WestsideEvidenceKey;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  outcomes: {
    wealthDelta: number;
    reputationDelta: number;
    relationshipEffects: Array<{
      citizenId: string | 'nearest_family' | 'nearest_colleague';
      strengthDelta: number;
      typeChange?: RelationshipType;
    }>;
    careerEffect?: Partial<CareerSnapshot>;
    narrativeResult: string;
    rippleSeeds: RippleSeed[];
  };
}

export interface Decision {
  id: string;
  worldId: string;
  playthroughId: string;
  citizenId: string;
  year: number;
  prompt: string;
  contextText: string; // Scene-setting paragraph before the choice
  locationId: string;
  category: DecisionCategory;
  chosenOptionId: string | null;
  options: DecisionOption[];
  triggeredByRippleId: string | null;
  isEvidenceDecision: boolean; // Part of Westside Files chain
  createdAt: string;
}

export interface DecisionTemplate {
  key: string;
  lifeStages: LifeStage[];
  category: DecisionCategory;
  locationTypes: LocationType[];
  condition: (c: Citizen, world: WorldSnapshot) => boolean;
  prompt: string;
  contextTemplate: string;
  options: Omit<DecisionOption, 'id'>[];
  isEvidenceDecision?: boolean;
  evidenceKey?: WestsideEvidenceKey;
  familySpecific?: FamilyArchetype; // If this decision only fires for a specific family
}

// ── WORLD ─────────────────────────────────────────────────────────────────────

export interface World {
  id: string;
  playerId: string;
  name: string;
  cityName: string;
  currentYear: number;
  startYear: number;
  playthroughCount: number;
  totalDecisionsMade: number;
  totalRipplesTriggered: number;
  totalRipplesRevealed: number;
  isPublic: boolean;
  shareCode: string;
  createdAt: string;
  updatedAt: string;
}

// Lightweight snapshot for decision condition evaluation
export interface WorldSnapshot {
  currentYear: number;
  districtWealth: Record<string, WealthTier>;
  activeBusinesses: string[];
  completedPlaythroughIds: string[];
  collectedEvidence: WestsideEvidenceKey[];
}

// ── PLAYTHROUGH ───────────────────────────────────────────────────────────────

export type PlaythroughStatus = 'active' | 'completed' | 'abandoned';

export interface Playthrough {
  id: string;
  worldId: string;
  citizenId: string;
  playerId: string;
  status: PlaythroughStatus;
  startedAt: string;
  completedAt: string | null;
  yearBorn: number;
  yearDied: number | null;
  currentYear: number;
  decisionsCount: number;
  ripplesGenerated: number;
  ripplesEncountered: number;
  legacyNote: string | null; // Auto-generated obituary/legacy text
  playerNotes: string;
}

// ── CITY EVENT (narrative log) ─────────────────────────────────────────────────

export type CityEventType =
  | 'birth' | 'death' | 'marriage' | 'divorce'
  | 'business_open' | 'business_close' | 'business_acquired'
  | 'inheritance' | 'scandal' | 'district_change'
  | 'political_event' | 'ripple_manifested'
  | 'evidence_unlocked' | 'family_secret_unlocked';

export interface CityEvent {
  id: string;
  worldId: string;
  year: number;
  title: string;
  description: string;
  involvedCitizenIds: string[];
  familyIds: string[];
  districtId: string | null;
  eventType: CityEventType;
  generatedByPlaythroughId: string | null;
  generatedByRippleId: string | null;
  createdAt: string;
}

// ── NEWSPAPER ─────────────────────────────────────────────────────────────────

export interface NewsHeadline {
  id: string;
  worldId: string;
  year: number;
  headline: string;
  subheadline: string;
  section: 'news' | 'business' | 'community' | 'obituaries' | 'politics';
  isVisible: boolean;
  generatedByPlaythroughId: string | null;
  generatedByDecisionId: string | null;
  generatedByEventId: string | null;
}

// ── WESTSIDE FILES (meta-mystery) ─────────────────────────────────────────────

export type WestsideEvidenceKey =
  | 'dmitri_journal'
  | 'webb_closed_report'
  | 'wei_signature'
  | 'ida_diary'
  | 'margaret_journal'
  | 'reyes_contract';

export interface WestsideEvidence {
  key: WestsideEvidenceKey;
  title: string;
  year: number; // Year of the document
  sourceFamily: string;
  unlockCondition: string;
  requiredPlaythroughFamily: FamilyArchetype;
  documentText: string; // The actual document/diary content
  forensicNote: string; // What this piece reveals about the larger mystery
  isCollected: boolean;
}

export interface WestsideFilesState {
  worldId: string;
  collectedEvidence: WestsideEvidenceKey[];
  isUnlocked: boolean; // True after 5+ chars across 3+ families
  isComplete: boolean; // All 6 pieces collected
  leilaRevealed: boolean; // Sofia's daughter revealed as playable
}

// ── VOTE (2024 development crisis) ────────────────────────────────────────────

export interface VoteOutcome {
  worldId: string;
  voteYear: number;
  inFavorCount: number;
  againstCount: number;
  abstainCount: number;
  outcome: 'approved' | 'rejected' | 'stalled' | null;
  charactersVotedIds: string[];
  charactersRemainingIds: string[];
  isLiveSessionActive: boolean;
}

// ── HISTORICAL SILENCE (queer thread tracker) ─────────────────────────────────

export interface HistoricalSilence {
  id: string;
  worldId: string;
  year: number;
  description: string; // Vague, unnamed reference observed in a playthrough
  revealedByJordanWebb: boolean;
  citizenId: string; // Who this silence was about
}

// ── MULTIPLAYER ───────────────────────────────────────────────────────────────

export interface CityPlayer {
  playerId: string;
  displayName: string;
  familyClaimed: FamilyArchetype | null;
  joinedAt: string;
  lastActiveAt: string;
  isCityFounder: boolean;
  playthroughsCompleted: number;
}

// ── UI / APP STATE ────────────────────────────────────────────────────────────

export type CityLivesPhase =
  | 'world-select'
  | 'character-select'
  | 'location-map'
  | 'dialogue'
  | 'decision'
  | 'ripple-reveal'
  | 'life-transition'
  | 'legacy-note'
  | 'city-view'
  | 'westside-files'
  | 'newspaper'
  | 'family-tree'
  | 'timeline';

export interface CityLivesAppState {
  phase: CityLivesPhase;
  world: World | null;
  currentPlaythrough: Playthrough | null;
  activeCitizen: Citizen | null;
  pendingDecision: Decision | null;
  pendingRippleReveal: Ripple | null;
  isLoading: boolean;
  error: string | null;
}

// ── API RESPONSES ─────────────────────────────────────────────────────────────

export interface CreateWorldResponse {
  world: World;
  citizens: Citizen[];
  families: Family[];
  districts: District[];
}

export interface StartPlaythroughResponse {
  playthrough: Playthrough;
  citizen: Citizen;
  firstDecisions: Decision[];
  incomingRipples: number; // Count of sealed ripples waiting for this character
}

export interface MakeDecisionResponse {
  decision: Decision;
  updatedCitizen: Citizen;
  newRipples: number; // How many ripples were seeded to other characters
  revealedRipple: Ripple | null; // If this decision triggered a ripple reveal
  newHeadlines: NewsHeadline[];
  xpAwarded: number;
}

export interface CompletePlaythroughResponse {
  playthrough: Playthrough;
  legacyNote: string;
  newPlayableCharacters: Citizen[];
  westsidesFilesProgress: WestsideFilesState;
  xpAwarded: number;
}
