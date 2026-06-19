import React, { useState } from 'react';
import type { Citizen, Family, Location } from '../types';
import { FAMILIES } from '../data/families';
import { getEraTheme } from '../utils/eraTheme';
import { getNpcDialogue } from '../utils/npcDialogue';

interface SceneViewProps {
  location: Location;
  year: number;
  playerCitizen: Citizen;
  allCitizens: Citizen[];
  onLeave: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  home: 'Home',
  workplace: 'Workplace',
  neighborhood: 'Neighborhood',
  power_center: 'Power Center',
  meeting_place: 'Meeting Place',
  cultural: 'Cultural',
};

export function SceneView({ location, year, playerCitizen, allCitizens, onLeave }: SceneViewProps) {
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [chosenOption, setChosenOption] = useState<number | null>(null);

  const era = getEraTheme(year);

  const npcs = location.presentNpcIds
    .map(id => allCitizens.find(c => c.id === id))
    .filter((c): c is Citizen =>
      !!c && c.birthYear <= year && (c.deathYear === null || c.deathYear > year)
    );

  const activeNpc = activeNpcId ? npcs.find(c => c.id === activeNpcId) ?? null : null;
  const dialogue = activeNpc ? getNpcDialogue(activeNpc, year, playerCitizen, FAMILIES) : null;

  const handleBack = () => {
    setActiveNpcId(null);
    setChosenOption(null);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: era.bg,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"JetBrains Mono", monospace',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${era.accent}22`,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
        background: era.bg,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={onLeave}
          style={{
            background: 'none', border: 'none', color: era.accent,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px',
            padding: 0, letterSpacing: '2px',
          }}
        >
          ← LEAVE
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>
            {location.name}
          </div>
          <div style={{ fontSize: '10px', color: era.textMuted, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>
            {TYPE_LABELS[location.type] ?? location.type} · {year}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '640px', width: '100%', margin: '0 auto' }}>

        {/* Location description */}
        {!activeNpc && (
          <div style={{
            background: `${era.accent}08`,
            border: `1px solid ${era.accent}22`,
            borderRadius: '10px',
            padding: '18px 20px',
            marginBottom: '28px',
          }}>
            <p style={{ color: '#444', fontSize: '13px', lineHeight: '1.85', margin: 0 }}>
              {location.description}
            </p>
          </div>
        )}

        {/* People list */}
        {!activeNpc && npcs.length > 0 && (
          <div>
            <div style={{
              fontSize: '10px', color: '#aaa', letterSpacing: '3px',
              textTransform: 'uppercase', marginBottom: '14px',
            }}>
              People Here
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {npcs.map(npc => {
                const npcFamily = FAMILIES.find(f => f.id === npc.familyId);
                return (
                  <NpcCard
                    key={npc.id}
                    npc={npc}
                    family={npcFamily ?? null}
                    year={year}
                    onTalk={() => { setActiveNpcId(npc.id); setChosenOption(null); }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {!activeNpc && npcs.length === 0 && (
          <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', paddingTop: '16px' }}>
            The place is quiet today.
          </div>
        )}

        {/* Dialogue */}
        {activeNpc && dialogue && (
          <DialoguePanel
            npc={activeNpc}
            dialogue={dialogue}
            chosenOption={chosenOption}
            onChoose={setChosenOption}
            onBack={handleBack}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

// ── NPC CARD ──────────────────────────────────────────────────────────────────

function NpcCard({ npc, family, year, onTalk }: {
  npc: Citizen;
  family: Family | null;
  year: number;
  onTalk: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const age = year - npc.birthYear;

  return (
    <button
      onClick={onTalk}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px',
        background: hovered ? '#f5f5f5' : '#fafafa',
        border: `1px solid ${hovered ? (family?.colorTheme ?? '#ccc') : '#ebebeb'}`,
        borderRadius: '10px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: family?.colorTheme ?? '#e0e0e0',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, flexShrink: 0,
      }}>
        {npc.firstName[0]}{npc.lastName[0]}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#111', fontSize: '14px' }}>
          {npc.firstName} {npc.lastName}
        </div>
        <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
          {npc.currentCareer?.title ?? 'Unknown'} · Age {Math.max(0, age)}
        </div>
        <p style={{
          color: '#666', fontSize: '11px', lineHeight: '1.5', margin: '6px 0 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        } as React.CSSProperties}>
          {npc.biography}
        </p>
      </div>

      <div style={{ color: '#aaa', fontSize: '18px', flexShrink: 0, paddingTop: '2px' }}>›</div>
    </button>
  );
}

// ── DIALOGUE PANEL ────────────────────────────────────────────────────────────

function DialoguePanel({ npc, dialogue, chosenOption, onChoose, onBack }: {
  npc: Citizen;
  dialogue: { greeting: string; options: { label: string; reply: string }[] };
  chosenOption: number | null;
  onChoose: (i: number) => void;
  onBack: () => void;
}) {
  const npcFamily = FAMILIES.find(f => f.id === npc.familyId);

  return (
    <div style={{ animation: 'fadeInUp 0.2s ease' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: '#aaa', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '11px', padding: '0 0 18px', letterSpacing: '1px',
        }}
      >
        ← Back to people
      </button>

      {/* NPC header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: npcFamily?.colorTheme ?? '#ccc',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, flexShrink: 0,
        }}>
          {npc.firstName[0]}{npc.lastName[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>
            {npc.firstName} {npc.lastName}
          </div>
          <div style={{ color: '#888', fontSize: '11px' }}>
            {npc.currentCareer?.title ?? 'Unknown'}
            {npcFamily ? ` · ${npcFamily.familyName}` : ''}
          </div>
        </div>
      </div>

      {/* NPC greeting bubble */}
      <div style={{
        background: '#f0f0f0',
        borderRadius: '12px 12px 12px 2px',
        padding: '14px 16px',
        marginBottom: '20px',
        maxWidth: '85%',
      }}>
        <p style={{ color: '#333', fontSize: '13px', lineHeight: '1.75', margin: 0 }}>
          {dialogue.greeting}
        </p>
      </div>

      {/* After choosing: show exchange */}
      {chosenOption !== null && (
        <div style={{ animation: 'fadeInUp 0.25s ease', marginBottom: '20px' }}>
          {/* Player bubble */}
          <div style={{
            background: '#111',
            borderRadius: '12px 12px 2px 12px',
            padding: '10px 14px',
            marginBottom: '10px',
            maxWidth: '80%',
            marginLeft: 'auto',
          }}>
            <p style={{ color: '#fff', fontSize: '12px', margin: 0 }}>
              {dialogue.options[chosenOption].label}
            </p>
          </div>
          {/* NPC reply bubble */}
          <div style={{
            background: '#f0f0f0',
            borderRadius: '12px 12px 12px 2px',
            padding: '14px 16px',
            maxWidth: '85%',
          }}>
            <p style={{ color: '#333', fontSize: '13px', lineHeight: '1.75', margin: 0 }}>
              {dialogue.options[chosenOption].reply}
            </p>
          </div>
        </div>
      )}

      {/* Response options */}
      {chosenOption === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dialogue.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onChoose(i)}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                background: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13px',
                color: '#333',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {chosenOption !== null && (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '12px',
            color: '#888',
            letterSpacing: '1px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          End conversation
        </button>
      )}
    </div>
  );
}
