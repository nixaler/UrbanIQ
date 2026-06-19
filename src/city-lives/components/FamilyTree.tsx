import React, { useState } from 'react';
import { FAMILIES, CITIZENS } from '../data/families';
import type { Citizen, Family } from '../types';

interface FamilyTreeProps {
  onBack: () => void;
  playedCitizenIds?: string[];
  sealedRipplesByCitizen?: Record<string, { id: string }[]>;
}

// Hardcoded parent → children relationships
const PARENT_CHILD: Record<string, string[]> = {
  henry_caldwell:    ['william_caldwell'],
  william_caldwell:  ['margaret_caldwell'],
  margaret_caldwell: ['oliver_caldwell'],
  oliver_caldwell:   ['claire_caldwell'],

  esperanza_reyes: ['roberto_reyes'],
  roberto_reyes:   ['ana_reyes', 'miguel_reyes'],
  ana_reyes:       ['rosa_reyes'],

  james_webb_sr:  ['james_webb_jr'],
  james_webb_jr:  ['denise_webb', 'marcus_webb'],
  denise_webb:    ['jordan_webb'],

  sofia_morozov:  ['nadia_morozov', 'anton_morozov', 'leila_hassan'],
  dmitri_morozov: [],

  wei_chen:    ['helen_chen'],
  helen_chen:  ['daniel_chen'],
  daniel_chen: ['maya_chen'],

  ida_washington:    ['thomas_washington'],
  thomas_washington: ['gloria_washington'],
  gloria_washington: ['darnell_washington', 'keisha_washington'],
  darnell_washington: ['zara_washington'],
};

// Secret connections (not shown until parent is played)
const SECRET_CHILDREN: Set<string> = new Set(['leila_hassan']);

// Generation layout per family: array of citizen-id arrays per row
const FAMILY_GENERATIONS: Record<string, string[][]> = {
  caldwell: [
    ['henry_caldwell'],
    ['william_caldwell'],
    ['margaret_caldwell'],
    ['oliver_caldwell'],
    ['claire_caldwell'],
  ],
  reyes: [
    ['esperanza_reyes'],
    ['roberto_reyes'],
    ['ana_reyes', 'miguel_reyes'],
    ['rosa_reyes'],
  ],
  webb: [
    ['james_webb_sr'],
    ['james_webb_jr'],
    ['denise_webb', 'marcus_webb'],
    ['jordan_webb'],
  ],
  morozov: [
    ['sofia_morozov', 'dmitri_morozov'],
    ['nadia_morozov', 'anton_morozov', 'leila_hassan'],
  ],
  chen: [
    ['wei_chen'],
    ['helen_chen'],
    ['daniel_chen'],
    ['maya_chen'],
  ],
  washington: [
    ['ida_washington'],
    ['thomas_washington'],
    ['gloria_washington'],
    ['darnell_washington', 'keisha_washington'],
    ['zara_washington'],
  ],
};

export function FamilyTree({ onBack, playedCitizenIds = [], sealedRipplesByCitizen = {} }: FamilyTreeProps) {
  const [activeFamilyId, setActiveFamilyId] = useState<string>('caldwell');

  const family = FAMILIES.find(f => f.id === activeFamilyId) ?? FAMILIES[0];
  const generations = FAMILY_GENERATIONS[activeFamilyId] ?? [];

  // Any character played from sofia reveals leila
  const sofiaPlayed = playedCitizenIds.includes('sofia_morozov');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      color: '#111',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #e8e8e8',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', padding: 0, letterSpacing: '2px' }}
        >
          ← BACK
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Family Histories
          </h1>
          <p style={{ margin: '2px 0 0', color: '#aaa', fontSize: '11px' }}>
            Six families. 105 years. Every thread connected.
          </p>
        </div>
      </div>

      {/* Family tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid #e8e8e8',
        overflowX: 'auto',
        padding: '0 24px',
      }}>
        {FAMILIES.map(f => {
          const active = f.id === activeFamilyId;
          const playedCount = f.memberIds.filter(id => playedCitizenIds.includes(id)).length;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFamilyId(f.id)}
              style={{
                padding: '14px 18px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? f.colorTheme : 'transparent'}`,
                color: active ? f.colorTheme : '#888',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {f.familyName}
              {playedCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  background: f.colorTheme,
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '9px',
                }}>
                  {playedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Family tagline + secret unlock status */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f5f5f5',
        background: `${family.colorTheme}06`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', color: family.colorTheme, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {family.familyName} · {family.archetype}
            </span>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
              "{family.tagline}"
            </p>
          </div>
          {family.secretUnlocked && (
            <div style={{
              background: '#FFF8E1',
              border: '1px solid #FFB80044',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#B8860B',
            }}>
              ◎ Secret Unlocked
            </div>
          )}
          {!family.secretUnlocked && (
            <div style={{ fontSize: '11px', color: '#ccc' }}>
              {family.memberIds.filter(id => playedCitizenIds.includes(id)).length}/{family.secretRequiredPlaythroughs} lives to unlock secret
            </div>
          )}
        </div>
      </div>

      {/* Tree */}
      <div style={{ padding: '32px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', minWidth: 'fit-content' }}>
          {generations.map((gen, genIndex) => {
            const isLast = genIndex === generations.length - 1;

            return (
              <React.Fragment key={genIndex}>
                {/* Generation row */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                }}>
                  {gen.map(citizenId => {
                    const citizen = CITIZENS.find(c => c.id === citizenId);
                    const isSecret = SECRET_CHILDREN.has(citizenId);
                    const isRevealed = !isSecret || sofiaPlayed;
                    const played = playedCitizenIds.includes(citizenId);
                    const rippleCount = sealedRipplesByCitizen[citizenId]?.length ?? 0;

                    return (
                      <CitizenNode
                        key={citizenId}
                        citizen={citizen ?? null}
                        citizenId={citizenId}
                        played={played}
                        isRevealed={isRevealed}
                        isSecret={isSecret}
                        rippleCount={rippleCount}
                        familyColor={family.colorTheme}
                      />
                    );
                  })}
                </div>

                {/* Connector to next generation */}
                {!isLast && (
                  <div style={{
                    width: '1px',
                    height: '32px',
                    background: '#ddd',
                    margin: '0 auto',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Secret reveal hint */}
        {activeFamilyId === 'morozov' && !sofiaPlayed && (
          <div style={{
            marginTop: '24px',
            padding: '12px 16px',
            background: '#FFF8E1',
            border: '1px solid #FFB80022',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#B8860B',
            textAlign: 'center',
          }}>
            ◎ Play Sofia Morozov to reveal the full family tree.
          </div>
        )}

        {/* Secret text (if unlocked) */}
        {family.secretUnlocked && (
          <div style={{
            marginTop: '32px',
            padding: '20px 24px',
            background: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: '10px',
            maxWidth: '560px',
            margin: '32px auto 0',
          }}>
            <div style={{ color: '#B8860B', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
              {family.secretTitle}
            </div>
            <p style={{ color: '#555', fontSize: '13px', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-line' }}>
              {family.secretText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CITIZEN NODE ──────────────────────────────────────────────────────────────

function CitizenNode({
  citizen, citizenId, played, isRevealed, isSecret, rippleCount, familyColor,
}: {
  citizen: Citizen | null;
  citizenId: string;
  played: boolean;
  isRevealed: boolean;
  isSecret: boolean;
  rippleCount: number;
  familyColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  if (!isRevealed) {
    return (
      <div style={{
        width: '140px',
        padding: '14px',
        border: '1px dashed #e0e0e0',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#ccc',
        fontSize: '11px',
      }}>
        <div style={{ fontSize: '20px', marginBottom: '6px', opacity: 0.3 }}>?</div>
        <div>Unknown</div>
      </div>
    );
  }

  if (!citizen) {
    return (
      <div style={{
        width: '140px',
        padding: '14px',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#bbb',
        fontSize: '11px',
      }}>
        {citizenId.replace(/_/g, ' ')}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '150px',
        padding: '14px',
        background: played ? `${familyColor}0d` : '#fafafa',
        border: `1px solid ${played ? familyColor + '44' : '#e8e8e8'}`,
        borderRadius: '8px',
        textAlign: 'center',
        transition: 'all 0.15s ease',
        opacity: played ? 1 : 0.6,
        position: 'relative',
        cursor: 'default',
      }}
    >
      {/* Played indicator */}
      {played && (
        <div style={{
          position: 'absolute',
          top: '-8px', left: '50%',
          transform: 'translateX(-50%)',
          background: familyColor,
          color: '#fff',
          borderRadius: '10px',
          padding: '1px 8px',
          fontSize: '8px',
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
        }}>
          PLAYED
        </div>
      )}

      {/* Secret indicator */}
      {isSecret && (
        <div style={{
          position: 'absolute',
          top: '-8px', right: '8px',
          background: '#FFB800',
          color: '#fff',
          borderRadius: '10px',
          padding: '1px 6px',
          fontSize: '8px',
        }}>
          ◎
        </div>
      )}

      {/* Avatar initial */}
      <div style={{
        width: '36px', height: '36px',
        borderRadius: '50%',
        background: played ? familyColor : '#e8e8e8',
        color: played ? '#fff' : '#aaa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 700,
        margin: '0 auto 8px',
      }}>
        {citizen.firstName[0]}{citizen.lastName[0]}
      </div>

      <div style={{ fontSize: '12px', fontWeight: 600, color: played ? '#111' : '#888', marginBottom: '2px' }}>
        {citizen.firstName} {citizen.lastName}
      </div>
      <div style={{ fontSize: '10px', color: '#aaa' }}>
        {citizen.birthYear}–{citizen.deathYear ?? 'present'}
      </div>

      {rippleCount > 0 && (
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          color: '#B8860B',
        }}>
          ◎ {rippleCount} ripple{rippleCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Hover bio */}
      {hovered && played && citizen.biography && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          width: '240px',
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          fontSize: '11px',
          color: '#555',
          lineHeight: '1.6',
          textAlign: 'left',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          {citizen.biography}
        </div>
      )}
    </div>
  );
}
