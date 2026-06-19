import React, { useState } from 'react';
import type { Citizen, CityEvent, Decision, Family, Playthrough, Ripple } from '../types';
import { getLifeStage } from '../engine/decisionEngine';
import { HISTORICAL_EVENTS } from '../data/crestfield';

interface LifeEvent {
  year: number;
  type: 'decision' | 'ripple' | 'city' | 'life';
  title: string;
  description: string;
  isSealed?: boolean; // Unrevealed incoming ripple
}

interface LifeViewProps {
  citizen: Citizen;
  family: Family;
  playthrough: Playthrough;
  decisions: Decision[];
  revealedRipples: Ripple[];
  sealedRippleCount: number;
  cityEvents: CityEvent[];
  pendingDecision: Decision | null;
  onMakeDecision: (decisionId: string) => void;
  onAdvanceYear: () => void;
  onCompleteLife: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  decision: '#4A90D9',
  ripple: '#FFB800',
  city: '#555',
  life: '#4CAF50',
};

const TYPE_ICONS: Record<string, string> = {
  decision: '◆',
  ripple: '◎',
  city: '○',
  life: '●',
};

export function LifeView({
  citizen, family, playthrough, decisions, revealedRipples,
  sealedRippleCount, cityEvents, pendingDecision,
  onMakeDecision, onAdvanceYear, onCompleteLife,
}: LifeViewProps) {
  const [showDecisionPrompt, setShowDecisionPrompt] = useState(false);
  const currentYear = playthrough.currentYear;
  const age = currentYear - citizen.birthYear;
  const stage = getLifeStage(citizen, currentYear);
  const isNearDeath = citizen.deathYear ? currentYear >= citizen.deathYear - 3 : age >= 72;

  // Build life event feed
  const lifeEvents: LifeEvent[] = buildLifeEvents(
    citizen, playthrough, decisions, revealedRipples, cityEvents, currentYear
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      color: '#111',
      fontFamily: '"JetBrains Mono", monospace',
      paddingTop: '72px', // HUD bar space
    }}>
      {/* Stage banner */}
      <div style={{
        background: `${family.colorTheme}0a`,
        borderBottom: `1px solid ${family.colorTheme}30`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ color: family.colorTheme, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px' }}>
          {stage === 'child' ? 'Childhood' : stage === 'youth' ? 'Coming of Age' : stage === 'adult' ? 'Adult Years' : 'Final Years'}
        </div>
        {sealedRippleCount > 0 && (
          <div style={{ marginLeft: 'auto', color: '#FFB80066', fontSize: '11px' }}>
            {sealedRippleCount} sealed {sealedRippleCount === 1 ? 'ripple' : 'ripples'} waiting in this life
          </div>
        )}
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Life events feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {lifeEvents.map((event, i) => (
            <LifeEventRow key={`${event.year}-${i}`} event={event} isLast={i === lifeEvents.length - 1} />
          ))}
        </div>

        {/* Current year actions */}
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingDecision ? (
            <button
              onClick={() => onMakeDecision(pendingDecision.id)}
              style={{
                width: '100%',
                padding: '16px',
                background: `${family.colorTheme}15`,
                border: `1px solid ${family.colorTheme}`,
                borderRadius: '10px',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ color: family.colorTheme, fontSize: '11px', letterSpacing: '2px', marginBottom: '6px', textTransform: 'uppercase' }}>
                A Decision Awaits · {currentYear}
              </div>
              <div style={{ fontWeight: 600 }}>{pendingDecision.prompt.slice(0, 80)}…</div>
            </button>
          ) : isNearDeath ? (
            <button
              onClick={onCompleteLife}
              style={{
                width: '100%',
                padding: '16px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '10px',
                color: '#555',
                fontFamily: 'inherit',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Complete this life →
            </button>
          ) : (
            <button
              onClick={onAdvanceYear}
              style={{
                width: '100%',
                padding: '14px',
                background: 'none',
                border: '1px solid #ebebeb',
                borderRadius: '8px',
                color: '#bbb',
                fontFamily: 'inherit',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Time passes… ({currentYear + 1})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LIFE EVENT ROW ────────────────────────────────────────────────────────────

function LifeEventRow({ event, isLast }: { event: LifeEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = event.isSealed ? '#333' : TYPE_COLORS[event.type];

  return (
    <div style={{ display: 'flex', gap: '16px', paddingBottom: '20px' }}>
      {/* Timeline line + dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
        <div style={{ color, fontSize: '12px', lineHeight: 1, marginBottom: '4px', marginTop: '2px' }}>
          {event.isSealed ? '?' : TYPE_ICONS[event.type]}
        </div>
        {!isLast && (
          <div style={{ flex: 1, width: '1px', background: '#e8e8e8', minHeight: '20px' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span style={{ color: '#555', fontSize: '11px', flexShrink: 0 }}>{event.year}</span>
          <span style={{
            color: event.isSealed ? '#ccc' : color === '#555' ? '#777' : color,
            fontSize: '13px',
            fontWeight: 500,
          }}>
            {event.isSealed ? '████████ ████' : event.title}
          </span>
        </div>
        {!event.isSealed && event.description && (
          <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
            {event.description}
          </p>
        )}
        {event.isSealed && (
          <p style={{ color: '#ccc', fontSize: '12px', margin: 0 }}>
            A past decision is waiting to arrive in this year.
          </p>
        )}
      </div>
    </div>
  );
}

// ── BUILD LIFE EVENTS ─────────────────────────────────────────────────────────

function buildLifeEvents(
  citizen: Citizen,
  playthrough: Playthrough,
  decisions: Decision[],
  ripples: Ripple[],
  cityEvents: CityEvent[],
  currentYear: number
): LifeEvent[] {
  const events: LifeEvent[] = [];

  // Birth
  events.push({
    year: citizen.birthYear,
    type: 'life',
    title: `${citizen.firstName} ${citizen.lastName} is born`,
    description: `Born in ${citizen.birthYear} in Crestfield.`,
  });

  // Completed decisions
  for (const d of decisions.filter(d => d.chosenOptionId && d.year <= currentYear)) {
    const chosenOption = d.options.find(o => o.id === d.chosenOptionId);
    events.push({
      year: d.year,
      type: 'decision',
      title: chosenOption?.label ?? 'A Decision',
      description: chosenOption?.outcomes.narrativeResult ?? '',
    });
  }

  // Revealed ripples
  for (const r of ripples.filter(r => r.isRevealed)) {
    events.push({
      year: r.resolvedYear ?? r.manifestYear,
      type: 'ripple',
      title: 'A Past Decision Arrives',
      description: r.resolvedNarrative ?? r.narrativeTemplate,
    });
  }

  // Relevant city events
  const relevantCityEvents = HISTORICAL_EVENTS.filter(
    e => e.year >= citizen.birthYear && e.year <= currentYear
  );
  for (const ce of relevantCityEvents) {
    events.push({
      year: ce.year,
      type: 'city',
      title: ce.title,
      description: ce.description,
    });
  }

  // Sort by year
  events.sort((a, b) => a.year - b.year || (a.type === 'life' ? -1 : 1));

  return events;
}
