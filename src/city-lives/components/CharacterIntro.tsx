import React, { useState, useEffect } from 'react';
import type { Citizen, Family, Ripple } from '../types';
import { getEraTheme } from '../utils/eraTheme';

interface CharacterIntroProps {
  citizen: Citizen;
  family: Family;
  sealedRippleCount: number;
  isLoading: boolean;
  onBegin: () => void;
  onBack: () => void;
}

export function CharacterIntro({ citizen, family, sealedRippleCount, isLoading, onBegin, onBack }: CharacterIntroProps) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const era = getEraTheme(citizen.birthYear);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 900);
    const t3 = setTimeout(() => setStage(3), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const yearsText = citizen.deathYear
    ? `${citizen.birthYear}–${citizen.deathYear}`
    : `b. ${citizen.birthYear}`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      fontFamily: '"JetBrains Mono", monospace',
      overflow: 'hidden',
    }}>
      {/* City photo background */}
      <img
        src="/photo-chi.jpg"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />

      {/* Era + family color overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${era.bg} 40%, ${family.colorTheme}22 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Family color bar at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '4px',
        background: family.colorTheme,
      }} />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'none', border: 'none',
          color: era.textMuted, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '12px',
          letterSpacing: '2px',
          zIndex: 1,
        }}
      >
        ← BACK
      </button>

      {/* Main content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        padding: '80px 48px',
        maxWidth: '680px',
      }}>
        {/* Era + years (stage 0) */}
        <div style={{
          opacity: stage >= 0 ? 1 : 0,
          transform: stage >= 0 ? 'none' : 'translateY(8px)',
          transition: 'all 0.5s ease',
          marginBottom: '8px',
        }}>
          <span style={{
            fontSize: '11px',
            color: era.accent,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}>
            CRESTFIELD · {yearsText}
          </span>
        </div>

        {/* Character name (stage 1) */}
        <div style={{
          opacity: stage >= 1 ? 1 : 0,
          transform: stage >= 1 ? 'none' : 'translateY(12px)',
          transition: 'all 0.5s ease 0.1s',
          marginBottom: '4px',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 900,
            color: '#111',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}>
            {citizen.firstName}
          </h1>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 900,
            color: '#111',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}>
            {citizen.lastName}
          </h1>
        </div>

        {/* Family badge + career */}
        <div style={{
          opacity: stage >= 1 ? 1 : 0,
          transform: stage >= 1 ? 'none' : 'translateY(8px)',
          transition: 'all 0.5s ease 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '16px',
          marginBottom: '32px',
        }}>
          <span style={{
            background: `${family.colorTheme}18`,
            border: `1px solid ${family.colorTheme}66`,
            color: family.colorTheme,
            padding: '4px 12px',
            borderRadius: '3px',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            {family.familyName}
          </span>
          <span style={{ color: era.textMuted, fontSize: '12px' }}>
            {citizen.currentCareer?.title ?? 'Unknown'}
          </span>
        </div>

        {/* Tagline (stage 2) */}
        <div style={{
          opacity: stage >= 2 ? 1 : 0,
          transform: stage >= 2 ? 'none' : 'translateY(8px)',
          transition: 'all 0.5s ease 0.1s',
          marginBottom: '20px',
        }}>
          <p style={{
            margin: 0,
            color: era.textMuted,
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderLeft: `3px solid ${family.colorTheme}`,
            paddingLeft: '12px',
          }}>
            {family.tagline}
          </p>
        </div>

        {/* Biography (stage 2) */}
        <div style={{
          opacity: stage >= 2 ? 1 : 0,
          transform: stage >= 2 ? 'none' : 'translateY(8px)',
          transition: 'all 0.5s ease 0.2s',
          marginBottom: '20px',
        }}>
          <p style={{
            margin: 0,
            color: '#333',
            fontSize: '15px',
            lineHeight: '1.8',
            maxWidth: '520px',
          }}>
            {citizen.biography}
          </p>
        </div>

        {/* Traits (stage 2) */}
        <div style={{
          opacity: stage >= 2 ? 1 : 0,
          transition: 'all 0.5s ease 0.3s',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: sealedRippleCount > 0 ? '20px' : '40px',
        }}>
          {citizen.traitIds.slice(0, 4).map(trait => (
            <span key={trait} style={{
              fontSize: '10px',
              color: era.textMuted,
              border: `1px solid ${era.accent}44`,
              padding: '3px 8px',
              borderRadius: '3px',
              textTransform: 'capitalize',
              letterSpacing: '1px',
            }}>
              {trait}
            </span>
          ))}
        </div>

        {/* Sealed ripple hint (stage 2) */}
        {sealedRippleCount > 0 && (
          <div style={{
            opacity: stage >= 2 ? 1 : 0,
            transition: 'all 0.5s ease 0.4s',
            background: '#FFF8E1',
            border: '1px solid #FFB80044',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ color: '#B8860B', fontSize: '16px' }}>◎</span>
            <span style={{ color: '#B8860B', fontSize: '12px', lineHeight: '1.5' }}>
              This life is already shaped by{' '}
              <strong>{sealedRippleCount} {sealedRippleCount === 1 ? 'decision' : 'decisions'}</strong>{' '}
              made in another life — arriving in due time.
            </span>
          </div>
        )}

        {/* Begin button (stage 3) */}
        <div style={{
          opacity: stage >= 3 ? 1 : 0,
          transform: stage >= 3 ? 'none' : 'translateY(8px)',
          transition: 'all 0.5s ease',
        }}>
          <button
            onClick={onBegin}
            disabled={isLoading}
            style={{
              padding: '16px 36px',
              background: isLoading ? '#f0f0f0' : family.colorTheme,
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '2px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'ENTERING CRESTFIELD…' : `BEGIN ${citizen.firstName.toUpperCase()}'S STORY →`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
