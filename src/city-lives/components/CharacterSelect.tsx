import React, { useState } from 'react';
import type { Citizen, Family, Ripple } from '../types';
import { FAMILIES } from '../data/families';

interface CharacterSelectProps {
  citizens: Citizen[];
  families: Family[];
  sealedRipplesByCitizen: Record<string, Ripple[]>;
  completedPlaythroughCitizenIds: string[];
  westsideFilesUnlocked: boolean;
  onSelectCharacter: (citizenId: string) => void;
  onOpenWestsideFiles: () => void;
  onBack: () => void;
}

export function CharacterSelect({
  citizens, families, sealedRipplesByCitizen, completedPlaythroughCitizenIds,
  westsideFilesUnlocked, onSelectCharacter, onOpenWestsideFiles, onBack,
}: CharacterSelectProps) {
  const pendingRipplesByCitizen = sealedRipplesByCitizen;
  const onSelect = onSelectCharacter;
  const completedPlaythroughCount = completedPlaythroughCitizenIds.length;
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  const playableCitizens = citizens.filter(c => c.isPlayable && !c.playthroughId);
  const playedCitizens = citizens.filter(c => c.playthroughId !== null);

  const filteredPlayable = selectedFamily
    ? playableCitizens.filter(c => c.familyId === selectedFamily)
    : playableCitizens;

  const getFamily = (familyId: string | null) =>
    families.find(f => f.id === familyId) ?? null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#fff',
      fontFamily: '"JetBrains Mono", monospace',
      padding: '40px 24px',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              Crestfield
            </h1>
            <p style={{ margin: '6px 0 0', color: '#555', fontSize: '13px' }}>
              {completedPlaythroughCount === 0
                ? 'Choose a character to begin.'
                : `${completedPlaythroughCount} ${completedPlaythroughCount === 1 ? 'life' : 'lives'} lived. The city carries their decisions.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {westsideFilesUnlocked && (
              <button
                onClick={onOpenWestsideFiles}
                style={{
                  background: 'none',
                  border: '1px solid #FFB80033',
                  color: '#FFB800',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                }}
              >
                ◎ Westside Files
              </button>
            )}
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: '1px solid #1a1a1a',
                color: '#444',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Family filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <FilterChip
            label="All Families"
            active={selectedFamily === null}
            onClick={() => setSelectedFamily(null)}
            color="#888"
          />
          {families.map(f => (
            <FilterChip
              key={f.id}
              label={f.familyName}
              active={selectedFamily === f.id}
              onClick={() => setSelectedFamily(f.id)}
              color={f.colorTheme}
            />
          ))}
        </div>

        {/* Playable characters */}
        {filteredPlayable.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredPlayable.map(citizen => {
              const family = getFamily(citizen.familyId);
              const ripples = pendingRipplesByCitizen[citizen.id] ?? [];
              return (
                <CharacterCard
                  key={citizen.id}
                  citizen={citizen}
                  family={family}
                  rippleCount={ripples.length}
                  onSelect={() => onSelect(citizen.id)}
                />
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>
            {selectedFamily ? 'No unplayed characters in this family.' : 'All characters have been played.'}
          </div>
        )}

        {/* Played characters section */}
        {playedCitizens.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <h3 style={{ color: '#444', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
              Lives Already Lived
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {playedCitizens.map(citizen => {
                const family = getFamily(citizen.familyId);
                return (
                  <div key={citizen.id} style={{
                    padding: '16px',
                    border: '1px solid #1a1a1a',
                    borderRadius: '10px',
                    opacity: 0.5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: family?.colorTheme ?? '#555',
                      }} />
                      <span style={{ color: '#888', fontSize: '14px' }}>
                        {citizen.firstName} {citizen.lastName}
                      </span>
                      <span style={{ marginLeft: 'auto', color: '#444', fontSize: '11px' }}>
                        {citizen.birthYear}–{citizen.deathYear ?? 'present'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CHARACTER CARD ────────────────────────────────────────────────────────────

interface CharacterCardProps {
  citizen: Citizen;
  family: Family | null;
  rippleCount: number;
  onSelect: () => void;
}

function CharacterCard({ citizen, family, rippleCount, onSelect }: CharacterCardProps) {
  const [hovered, setHovered] = useState(false);

  const yearsActive = citizen.deathYear
    ? `${citizen.birthYear}–${citizen.deathYear}`
    : `b. ${citizen.birthYear}`;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        background: hovered ? '#0e0e0e' : '#0a0a0a',
        border: `1px solid ${hovered ? (family?.colorTheme ?? '#333') : '#1e1e1e'}`,
        borderRadius: '10px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: '"JetBrains Mono", monospace',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Family color bar */}
      {family && (
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: '3px',
          background: family.colorTheme,
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
            {citizen.firstName} {citizen.lastName}
          </div>
          <div style={{ color: '#555', fontSize: '11px', marginTop: '2px' }}>
            {yearsActive} · {citizen.currentCareer?.title ?? 'Unknown'}
          </div>
        </div>

        {/* Ripple badge */}
        {rippleCount > 0 && (
          <div style={{
            background: '#FFB80022',
            border: '1px solid #FFB800',
            color: '#FFB800',
            borderRadius: '20px',
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '9px' }}>◎</span>
            {rippleCount} {rippleCount === 1 ? 'ripple' : 'ripples'}
          </div>
        )}
      </div>

      {/* Biography */}
      <p style={{ color: '#777', fontSize: '12px', lineHeight: '1.6', margin: '0 0 12px' }}>
        {citizen.biography}
      </p>

      {/* Traits */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {citizen.traitIds.slice(0, 3).map(trait => (
          <span key={trait} style={{
            fontSize: '10px',
            color: '#555',
            border: '1px solid #222',
            padding: '2px 6px',
            borderRadius: '3px',
          }}>
            {trait}
          </span>
        ))}
      </div>

      {/* Ripple hint */}
      {rippleCount > 0 && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #1a1a1a',
          color: '#FFB80099',
          fontSize: '11px',
        }}>
          {rippleCount === 1
            ? '1 past decision has already shaped this life.'
            : `${rippleCount} past decisions have already shaped this life.`}
        </div>
      )}
    </button>
  );
}

// ── FILTER CHIP ───────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}22` : 'none',
        border: `1px solid ${active ? color : '#2a2a2a'}`,
        color: active ? color : '#555',
        padding: '5px 12px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: '"JetBrains Mono", monospace',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}
