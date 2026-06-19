import React from 'react';
import type { Citizen, Family, Playthrough } from '../types';
import { getLifeStage } from '../engine/decisionEngine';

interface HUDBarProps {
  citizen: Citizen;
  family: Family;
  playthrough: Playthrough;
  onBack: () => void;
  onOpenWestsideFiles?: () => void;
}

const LIFE_STAGE_LABELS: Record<string, string> = {
  child: 'Childhood',
  youth: 'Coming of Age',
  adult: 'Adult Life',
  elder: 'Elder Years',
};

const WEALTH_ICONS: Record<number, string> = {
  0: '◌◌◌◌',
  1: '◉◌◌◌',
  2: '◉◉◌◌',
  3: '◉◉◉◌',
  4: '◉◉◉◉',
};

export function HUDBar({ citizen, family, playthrough, onBack, onOpenWestsideFiles }: HUDBarProps) {
  const age = playthrough.currentYear - citizen.birthYear;
  const stage = getLifeStage(citizen, playthrough.currentYear);
  const repBar = Math.max(0, Math.min(100, citizen.reputationScore + 100)) / 2; // 0-100 display

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(8, 8, 8, 0.95)',
      borderBottom: `2px solid ${family.colorTheme}`,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0 8px 0 0',
          lineHeight: 1,
        }}
        aria-label="Back to city"
      >
        ←
      </button>

      {/* Character info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
            {citizen.firstName} {citizen.lastName}
          </span>
          <span style={{
            fontSize: '11px',
            color: family.colorTheme,
            padding: '1px 6px',
            border: `1px solid ${family.colorTheme}`,
            borderRadius: '3px',
          }}>
            {family.familyName}
          </span>
        </div>
        <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
          {LIFE_STAGE_LABELS[stage]} · Age {age} · {citizen.currentCareer?.title ?? 'Unemployed'}
        </div>
      </div>

      {/* Year */}
      <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid #222', borderRight: '1px solid #222' }}>
        <div style={{ color: '#FFB800', fontWeight: 700, fontSize: '22px', lineHeight: 1 }}>
          {playthrough.currentYear}
        </div>
        <div style={{ color: '#555', fontSize: '10px', marginTop: '2px' }}>CRESTFIELD</div>
      </div>

      {/* Westside Files button */}
      {onOpenWestsideFiles && (
        <button
          onClick={onOpenWestsideFiles}
          style={{
            background: 'none',
            border: '1px solid #1a1a1a',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#FFB80066',
            fontFamily: 'inherit',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '1px',
          }}
          title="The Westside Files"
        >
          ◎ FILES
        </button>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#555', fontSize: '10px', width: '20px' }}>$</span>
          <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '2px' }}>
            {WEALTH_ICONS[citizen.wealthTier]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#555', fontSize: '10px', width: '20px' }}>REP</span>
          <div style={{
            height: '4px',
            width: '72px',
            background: '#222',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${repBar}%`,
              background: citizen.reputationScore > 20 ? '#4CAF50' : citizen.reputationScore > -20 ? '#FFB800' : '#e53935',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
