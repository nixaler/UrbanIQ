import React, { useState, useCallback } from 'react';
import { useWorld } from '../hooks/useWorld';
import { CharacterSelect } from './CharacterSelect';
import { CharacterIntro } from './CharacterIntro';
import { LifeView } from './LifeView';
import { DecisionModal } from './DecisionModal';
import { RippleReveal } from './RippleReveal';
import { WestsideFiles } from './WestsideFiles';
import { CityMap } from './CityMap';
import { FamilyTree } from './FamilyTree';
import { VoteView } from './VoteView';
import { HUDBar } from './HUDBar';
import { useEraAudio } from '../hooks/useEraAudio';
import { FAMILIES, CITIZENS } from '../data/families';

// ── Constants ──────────────────────────────────────────────────────────────────

const VOTE_ELIGIBLE = new Set([
  'keisha_washington', 'ana_reyes', 'marcus_webb',
  'maya_chen', 'rosa_reyes', 'claire_caldwell',
]);

// ── Sub-phase type ─────────────────────────────────────────────────────────────

type SubPhase =
  | 'world-select'
  | 'character-select'
  | 'intro'
  | 'playing'
  | 'decision'
  | 'ripple-reveal'
  | 'westside-files'
  | 'vote'
  | 'city-map'
  | 'family-tree';

interface CityLivesGameProps {
  onBack: () => void;
}

// ── Root component ─────────────────────────────────────────────────────────────

export function CityLivesGame({ onBack }: CityLivesGameProps) {
  const [worldId, setWorldId] = useState<string | null>(() =>
    localStorage.getItem('cl:worldId')
  );
  const [subPhase, setSubPhase] = useState<SubPhase>(worldId ? 'character-select' : 'world-select');
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [pendingCitizenId, setPendingCitizenId] = useState<string | null>(null);
  const [voteCompleted, setVoteCompleted] = useState(false);

  const world = useWorld(worldId);

  const currentYear = world.currentPlaythrough?.currentYear ?? 1950;
  const { enabled: audioEnabled, toggle: toggleAudio } = useEraAudio(currentYear);

  // If stored worldId no longer exists on the server, clear it and go back to world-select
  React.useEffect(() => {
    if (world.error && world.error.toLowerCase().includes('not found')) {
      localStorage.removeItem('cl:worldId');
      setWorldId(null);
      setSubPhase('world-select');
    }
  }, [world.error]);

  // Reset vote flag when citizen changes
  React.useEffect(() => {
    setVoteCompleted(false);
  }, [world.activeCitizen?.id]);

  // ── World creation ──────────────────────────────────────────────────────────

  const handleCreateWorld = useCallback(async () => {
    try {
      const w = await world.createWorld('Crestfield');
      localStorage.setItem('cl:worldId', w.id);
      setWorldId(w.id);
      setSubPhase('character-select');
    } catch {
      // error is already in world.error
    }
  }, [world]);

  // ── Character selection → intro → playing ──────────────────────────────────

  const handleSelectCharacter = useCallback((citizenId: string) => {
    setPendingCitizenId(citizenId);
    setSubPhase('intro');
  }, []);

  const handleBeginLife = useCallback(async () => {
    if (!pendingCitizenId) return;
    await world.startPlaythrough(pendingCitizenId);
    setPendingCitizenId(null);
    setSubPhase('playing');
  }, [pendingCitizenId, world]);

  // ── Year advancement (with vote intercept) ─────────────────────────────────

  const handleAdvanceYear = useCallback(() => {
    const nextYear = (world.currentPlaythrough?.currentYear ?? 0) + 1;
    world.advanceYear();
    if (
      nextYear >= 2024 &&
      !voteCompleted &&
      world.activeCitizen &&
      VOTE_ELIGIBLE.has(world.activeCitizen.id)
    ) {
      setSubPhase('vote');
    }
  }, [world, voteCompleted]);

  // ── Decision flow ───────────────────────────────────────────────────────────

  const handleMakeDecision = useCallback((decisionId: string) => {
    setActiveDecisionId(decisionId);
    setSubPhase('decision');
  }, []);

  const handleChooseOption = useCallback(async (optionId: string) => {
    if (!activeDecisionId) return;
    await world.makeDecision(activeDecisionId, optionId);
    setActiveDecisionId(null);

    if (world.pendingRippleReveal) {
      setSubPhase('ripple-reveal');
    } else {
      setSubPhase('playing');
    }
  }, [activeDecisionId, world]);

  const handleDismissRipple = useCallback(() => {
    world.dismissRipple();
    setSubPhase('playing');
  }, [world]);

  // ── Vote flow ───────────────────────────────────────────────────────────────

  const handleVote = useCallback((_choice: 'yes' | 'no') => {
    setVoteCompleted(true);
    setSubPhase('playing');
  }, []);

  // ── Life completion ─────────────────────────────────────────────────────────

  const handleCompleteLife = useCallback(async () => {
    await world.completePlaythrough();
    setSubPhase('character-select');
  }, [world]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const openWestsideFiles = useCallback(() => setSubPhase('westside-files'), []);
  const openCityMap = useCallback(() => setSubPhase('city-map'), []);
  const openFamilyTree = useCallback(() => setSubPhase('family-tree'), []);

  // ── Derived values ──────────────────────────────────────────────────────────

  const activeFamily = world.activeCitizen
    ? FAMILIES.find(f => f.id === world.activeCitizen!.familyId) ?? FAMILIES[0]
    : FAMILIES[0];

  const activeDecision = activeDecisionId
    ? world.activeDecisions.find(d => d.id === activeDecisionId) ?? null
    : null;

  const rippleSourceCitizen = world.pendingRippleReveal?.sourceCitizenId
    ? CITIZENS.find(c => c.id === world.pendingRippleReveal!.sourceCitizenId) ?? null
    : null;

  const sealedRippleCount = world.activeCitizen
    ? (world.sealedRipplesByCitizen[world.activeCitizen.id]?.length ?? 0)
    : 0;

  const pendingCitizen = pendingCitizenId
    ? (world.citizens.find(c => c.id === pendingCitizenId) ?? CITIZENS.find(c => c.id === pendingCitizenId) ?? null)
    : null;
  const pendingFamily = pendingCitizen
    ? FAMILIES.find(f => f.id === pendingCitizen.familyId) ?? FAMILIES[0]
    : FAMILIES[0];
  const pendingRippleCount = pendingCitizenId
    ? (world.sealedRipplesByCitizen[pendingCitizenId]?.length ?? 0)
    : 0;

  const playedCitizenIds = world.citizens
    .filter(c => c.playthroughId !== null)
    .map(c => c.id);

  const HUD_PHASES: SubPhase[] = ['playing', 'decision', 'ripple-reveal'];
  const showHUD = HUD_PHASES.includes(subPhase) && !!world.activeCitizen && !!world.currentPlaythrough;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (world.isLoading && !world.world) {
    return <LoadingScreen />;
  }

  if (subPhase === 'world-select') {
    return (
      <WorldSelectScreen
        isLoading={world.isLoading}
        error={world.error}
        onCreateWorld={handleCreateWorld}
        onBack={onBack}
      />
    );
  }

  return (
    <>
      {showHUD && (
        <HUDBar
          citizen={world.activeCitizen!}
          family={activeFamily}
          playthrough={world.currentPlaythrough!}
          year={currentYear}
          audioEnabled={audioEnabled}
          onToggleAudio={toggleAudio}
          onOpenWestsideFiles={openWestsideFiles}
          onBack={() => setSubPhase('character-select')}
        />
      )}

      {subPhase === 'character-select' && (
        <CharacterSelect
          citizens={world.citizens.length > 0 ? world.citizens : CITIZENS}
          families={FAMILIES}
          sealedRipplesByCitizen={world.sealedRipplesByCitizen}
          completedPlaythroughCitizenIds={playedCitizenIds}
          westsideFilesUnlocked={world.westsideFiles !== null}
          onSelectCharacter={handleSelectCharacter}
          onOpenWestsideFiles={openWestsideFiles}
          onOpenCityMap={openCityMap}
          onOpenFamilyTree={openFamilyTree}
          onBack={onBack}
        />
      )}

      {subPhase === 'intro' && pendingCitizen && (
        <CharacterIntro
          citizen={pendingCitizen}
          family={pendingFamily}
          sealedRippleCount={pendingRippleCount}
          isLoading={world.isLoading}
          onBegin={handleBeginLife}
          onBack={() => setSubPhase('character-select')}
        />
      )}

      {subPhase === 'playing' && world.activeCitizen && world.currentPlaythrough && (
        <LifeView
          citizen={world.activeCitizen}
          family={activeFamily}
          playthrough={world.currentPlaythrough}
          decisions={world.activeDecisions}
          revealedRipples={world.revealedRipples}
          sealedRippleCount={sealedRippleCount}
          cityEvents={world.cityEvents}
          pendingDecision={world.pendingDecision}
          onMakeDecision={handleMakeDecision}
          onAdvanceYear={handleAdvanceYear}
          onCompleteLife={handleCompleteLife}
        />
      )}

      {subPhase === 'decision' && activeDecision && (
        <DecisionModal
          decision={activeDecision}
          family={activeFamily}
          triggeringRipple={null}
          onChoose={handleChooseOption}
        />
      )}

      {subPhase === 'ripple-reveal' && world.pendingRippleReveal && (
        <RippleReveal
          ripple={world.pendingRippleReveal}
          sourceCitizen={rippleSourceCitizen}
          onDismiss={handleDismissRipple}
        />
      )}

      {subPhase === 'vote' && world.activeCitizen && (
        <VoteView
          citizen={world.activeCitizen}
          family={activeFamily}
          onVote={handleVote}
          onSkip={() => { setVoteCompleted(true); setSubPhase('playing'); }}
        />
      )}

      {subPhase === 'westside-files' && world.westsideFiles && (
        <WestsideFiles
          state={world.westsideFiles}
          onBack={() => setSubPhase(world.activeCitizen ? 'playing' : 'character-select')}
        />
      )}

      {subPhase === 'city-map' && (
        <CityMap
          onBack={() => setSubPhase('character-select')}
          playedCitizenIds={playedCitizenIds}
        />
      )}

      {subPhase === 'family-tree' && (
        <FamilyTree
          onBack={() => setSubPhase('character-select')}
          playedCitizenIds={playedCitizenIds}
          sealedRipplesByCitizen={world.sealedRipplesByCitizen}
        />
      )}

      {world.error && (
        <ErrorToast message={world.error} />
      )}
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#aaa',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.4 }}>◎</div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase' }}>Loading Crestfield…</div>
      </div>
    </div>
  );
}

interface WorldSelectScreenProps {
  isLoading: boolean;
  error: string | null;
  onCreateWorld: () => void;
  onBack: () => void;
}

function WorldSelectScreen({ isLoading, error, onCreateWorld, onBack }: WorldSelectScreenProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      color: '#111',
      fontFamily: '"JetBrains Mono", monospace',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', padding: 0, marginBottom: '48px', letterSpacing: '2px' }}
        >
          ← BACK
        </button>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#aaa', marginBottom: '12px', textTransform: 'uppercase' }}>
            A Generational Life Simulator
          </div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.2, color: '#111' }}>
            The City Lives
          </h1>
          <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.8', margin: '16px 0 0' }}>
            Play the lives of six interconnected families across four generations in Crestfield. Every decision you make echoes into someone else's story.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {['6 Families', '30 Characters', '1920–2025', 'Butterfly Effect', 'City Mystery'].map(tag => (
            <div key={tag} style={{
              padding: '4px 10px',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#888',
            }}>
              {tag}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ color: '#c0392b', fontSize: '12px', marginBottom: '16px', padding: '12px', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <button
          onClick={onCreateWorld}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '18px',
            background: isLoading ? '#f5f5f5' : '#111',
            border: 'none',
            borderRadius: '12px',
            color: isLoading ? '#aaa' : '#fff',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? 'SEEDING THE CITY…' : 'BEGIN A NEW WORLD →'}
        </button>

        <p style={{ color: '#ccc', fontSize: '11px', textAlign: 'center', marginTop: '16px', lineHeight: '1.6' }}>
          The city runs from 1920 to 2025. Every life you play adds to the history.
        </p>
      </div>
    </div>
  );
}

function ErrorToast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1a0000',
      border: '1px solid #e5393544',
      borderRadius: '8px',
      padding: '12px 20px',
      color: '#e53935',
      fontSize: '12px',
      fontFamily: '"JetBrains Mono", monospace',
      zIndex: 500,
      maxWidth: '400px',
    }}>
      {message}
    </div>
  );
}
