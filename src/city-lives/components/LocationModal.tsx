import React from 'react';
import type { Location, Citizen } from '../types';

interface LocationModalProps {
  location: Location;
  allCitizens: Citizen[];
  familyColorTheme: string;
  onClose: () => void;
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  home: 'Home',
  workplace: 'Workplace',
  neighborhood: 'Neighborhood',
  power_center: 'Power Center',
  meeting_place: 'Meeting Place',
  cultural: 'Cultural Space',
};

const LOCATION_ICONS: Record<string, string> = {
  home: '⌂',
  workplace: '◈',
  neighborhood: '◉',
  power_center: '◆',
  meeting_place: '◎',
  cultural: '♪',
};

export function LocationModal({ location, allCitizens, familyColorTheme, onClose }: LocationModalProps) {
  const npcs = location.presentNpcIds
    .map(id => allCitizens.find(c => c.id === id))
    .filter((c): c is Citizen => c !== undefined);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 0 0',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '28px 28px 40px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Handle */}
        <div style={{
          width: '40px', height: '4px',
          background: '#e8e8e8', borderRadius: '2px',
          margin: '0 auto 24px',
        }} />

        {/* Type badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '16px', color: familyColorTheme }}>
            {LOCATION_ICONS[location.type] ?? '○'}
          </span>
          <span style={{
            fontSize: '10px',
            color: familyColorTheme,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            {LOCATION_TYPE_LABELS[location.type] ?? location.type}
          </span>
          {location.activeYearEnd && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px',
              color: '#bbb',
              letterSpacing: '1px',
            }}>
              {location.activeYearStart}–{location.activeYearEnd}
            </span>
          )}
        </div>

        {/* Name */}
        <h2 style={{
          margin: '0 0 12px',
          fontSize: '20px',
          fontWeight: 700,
          color: '#111',
          letterSpacing: '-0.5px',
        }}>
          {location.name}
        </h2>

        {/* Description */}
        <p style={{
          margin: '0 0 24px',
          color: '#555',
          fontSize: '14px',
          lineHeight: '1.8',
        }}>
          {location.description}
        </p>

        {/* NPCs present */}
        {npcs.length > 0 && (
          <div style={{
            borderTop: '1px solid #f0f0f0',
            paddingTop: '16px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#aaa',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              Often Found Here
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {npcs.map(npc => (
                <div key={npc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%',
                    background: '#f5f5f5',
                    border: '1px solid #e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#888',
                    flexShrink: 0,
                  }}>
                    {npc.firstName[0]}{npc.lastName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#111', fontWeight: 500 }}>
                      {npc.firstName} {npc.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>
                      {npc.currentCareer?.title ?? 'Unknown'} · {npc.birthYear}–{npc.deathYear ?? 'present'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            background: 'none',
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            color: '#888',
            fontFamily: 'inherit',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Leave
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
