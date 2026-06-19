import React, { useState, useMemo, useEffect } from 'react';
import type { Citizen, CityEvent, Decision, Family, Playthrough, Ripple, Location } from '../types';
import { getLifeStage } from '../engine/decisionEngine';
import { HISTORICAL_EVENTS, LOCATIONS, getActiveLocations } from '../data/crestfield';
import { CITIZENS } from '../data/families';
import { getEraTheme } from '../utils/eraTheme';
import { getYearNarrative } from '../utils/yearNarrative';
import { SceneView } from './SceneView';
import { NewspaperModal } from './NewspaperModal';

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
  ripple:   '#FFB800',
  city:     '#888',
  life:     '#4CAF50',
};

const TYPE_ICONS: Record<string, string> = {
  decision: '◆',
  ripple:   '◎',
  city:     '○',
  life:     '●',
};

const CATEGORY_SHORT: Record<string, string> = {
  loyalty_vs_integrity:          'Loyalty vs. Integrity',
  community_vs_ambition:         'Community vs. Ambition',
  truth_vs_protection:           'Truth vs. Protection',
  complicity_vs_consequence:     'Complicity vs. Consequence',
  forgiveness_vs_accountability: 'Forgiveness vs. Accountability',
  survival_vs_solidarity:        'Survival vs. Solidarity',
};

interface LifeEvent {
  year: number;
  type: 'decision' | 'ripple' | 'city' | 'life';
  title: string;
  description: string;
  isSealed?: boolean;
}

export function LifeView({
  citizen, family, playthrough, decisions, revealedRipples,
  sealedRippleCount, cityEvents, pendingDecision,
  onMakeDecision, onAdvanceYear, onCompleteLife,
}: LifeViewProps) {
  const [sceneLocation, setSceneLocation] = useState<Location | null>(null);
  const [visitedLocations, setVisitedLocations] = useState<Set<string>>(new Set());
  const [showNewspaper, setShowNewspaper] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const currentYear = playthrough.currentYear;
  const age = currentYear - citizen.birthYear;
  const stage = getLifeStage(citizen, currentYear);
  const isNearDeath = citizen.deathYear ? currentYear >= citizen.deathYear - 2 : age >= 73;
  const era = getEraTheme(currentYear);

  const completedDecisions = decisions.filter(d => d.chosenOptionId);
  const yearNarrative = getYearNarrative(citizen, currentYear, completedDecisions);

  const availableLocations = useMemo(() =>
    getActiveLocations(citizen.districtId, currentYear).slice(0, 2),
    [citizen.districtId, currentYear]
  );

  // Reset visited locations when the year advances
  useEffect(() => {
    setVisitedLocations(new Set());
    setSceneLocation(null);
  }, [currentYear]);

  const handleVisitLocation = (loc: Location) => {
    setVisitedLocations(prev => new Set([...prev, loc.id]));
    setSceneLocation(loc);
  };

  const allLocationsVisited =
    availableLocations.length === 0 ||
    availableLocations.every(l => visitedLocations.has(l.id));

  // Build life event feed
  const lifeEvents: LifeEvent[] = useMemo(() =>
    buildLifeEvents(citizen, decisions, revealedRipples, currentYear),
    [citizen, decisions, revealedRipples, currentYear]
  );

  const recentEvents = showAllEvents ? lifeEvents : lifeEvents.slice(-5);

  return (
    <div style={{
      minHeight: '100vh',
      background: era.bg,
      color: '#111',
      fontFamily: '"JetBrains Mono", monospace',
      paddingTop: '68px',
      transition: 'background 0.8s ease',
    }}>

      {/* ── YEAR HERO CARD ─────────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${era.accent}20`,
        padding: '28px 24px 24px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Era name */}
          <div style={{ fontSize: '10px', color: era.accent, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {era.name}
          </div>

          {/* Year */}
          <div style={{ fontSize: '72px', fontWeight: 900, color: '#111', lineHeight: 1, letterSpacing: '-3px' }}>
            {currentYear}
          </div>

          {/* Narrative paragraph */}
          <p style={{
            color: '#444',
            fontSize: '14px',
            lineHeight: '1.85',
            margin: '16px 0 0',
            maxWidth: '560px',
          }}>
            {yearNarrative}
          </p>
        </div>
      </div>

      {/* ── ACTIVITIES ROW ─────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${era.accent}15`,
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: era.textMuted, letterSpacing: '2px', marginRight: '4px' }}>
            THIS YEAR:
          </span>

          {availableLocations.map(loc => {
            const visited = visitedLocations.has(loc.id);
            return (
              <button
                key={loc.id}
                onClick={() => handleVisitLocation(loc)}
                style={{
                  padding: '6px 14px',
                  background: visited ? `${era.accent}14` : 'none',
                  border: `1px solid ${visited ? era.accent + '66' : era.accent + '44'}`,
                  borderRadius: '20px',
                  color: visited ? era.accent : era.accent,
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: visited ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!visited) (e.target as HTMLElement).style.background = `${era.accent}11`; }}
                onMouseLeave={e => { if (!visited) (e.target as HTMLElement).style.background = 'none'; }}
              >
                {visited ? '✓' : '◉'} {loc.name}
              </button>
            );
          })}

          <button
            onClick={() => setShowNewspaper(true)}
            style={{
              padding: '6px 14px',
              background: 'none',
              border: '1px solid #d4c08844',
              borderRadius: '20px',
              color: '#B8860B',
              fontFamily: 'inherit',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = '#B8860B11'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
          >
            ◎ Read the Paper
          </button>
        </div>
      </div>

      {/* ── DECISION / ACTION ZONE ──────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {pendingDecision ? (
            <button
              onClick={() => onMakeDecision(pendingDecision.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '24px',
                background: `${family.colorTheme}0d`,
                border: `1.5px solid ${family.colorTheme}55`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${family.colorTheme}18`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${family.colorTheme}0d`; }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <div style={{
                  background: family.colorTheme,
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '9px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}>
                  Decision Awaits
                </div>
                <div style={{ color: '#aaa', fontSize: '11px' }}>
                  {CATEGORY_SHORT[pendingDecision.category]}
                </div>
                <div style={{ marginLeft: 'auto', color: family.colorTheme, fontSize: '12px' }}>
                  {currentYear} →
                </div>
              </div>

              <p style={{ color: '#555', fontSize: '13px', lineHeight: '1.7', margin: '0 0 12px' }}>
                {pendingDecision.contextText.slice(0, 160)}{pendingDecision.contextText.length > 160 ? '…' : ''}
              </p>

              <div style={{ color: '#111', fontWeight: 700, fontSize: '15px', lineHeight: '1.5' }}>
                {pendingDecision.prompt}
              </div>

              <div style={{
                marginTop: '16px',
                color: family.colorTheme,
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '1px',
              }}>
                MAKE THIS DECISION →
              </div>
            </button>

          ) : isNearDeath ? (
            <button
              onClick={onCompleteLife}
              style={{
                width: '100%',
                padding: '18px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '10px',
                color: '#555',
                fontFamily: 'inherit',
                fontSize: '13px',
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              Complete this life →
            </button>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Action dots — show remaining visits */}
              {availableLocations.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  {availableLocations.map(loc => (
                    <div
                      key={loc.id}
                      style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: visitedLocations.has(loc.id) ? era.accent : `${era.accent}33`,
                        transition: 'background 0.3s ease',
                      }}
                    />
                  ))}
                  <span style={{ fontSize: '10px', color: era.textMuted, letterSpacing: '1px' }}>
                    {allLocationsVisited
                      ? 'All locations visited'
                      : `${availableLocations.length - visitedLocations.size} place${availableLocations.length - visitedLocations.size !== 1 ? 's' : ''} left to explore`}
                  </span>
                </div>
              )}

              {/* Continue — prominent when all visited, muted when not */}
              {allLocationsVisited ? (
                <button
                  onClick={onAdvanceYear}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'none',
                    border: `1px solid ${era.accent}44`,
                    borderRadius: '10px',
                    color: era.accent,
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${era.accent}0a`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                >
                  Continue into {currentYear + 1} →
                </button>
              ) : (
                <button
                  onClick={onAdvanceYear}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'none',
                    border: `1px solid ${era.accent}18`,
                    borderRadius: '10px',
                    color: era.textMuted,
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${era.accent}06`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                >
                  Skip — continue into {currentYear + 1} →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── PAST EVENTS FEED ────────────────────────────────────────────── */}
      {lifeEvents.length > 0 && (
        <div style={{ padding: '24px 24px 48px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{
              borderTop: `1px solid ${era.accent}18`,
              paddingTop: '24px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '10px', color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {citizen.firstName}'s History
                </span>
                {sealedRippleCount > 0 && (
                  <span style={{ fontSize: '11px', color: '#FFB80077' }}>
                    ◎ {sealedRippleCount} sealed {sealedRippleCount === 1 ? 'ripple' : 'ripples'} arriving in time
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {recentEvents.map((event, i) => (
                  <LifeEventRow
                    key={`${event.year}-${i}`}
                    event={event}
                    isLast={i === recentEvents.length - 1}
                    eraAccent={era.accent}
                  />
                ))}
              </div>

              {lifeEvents.length > 5 && (
                <button
                  onClick={() => setShowAllEvents(v => !v)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#bbb',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '12px 0 0',
                    letterSpacing: '1px',
                  }}
                >
                  {showAllEvents
                    ? '▲ Show recent only'
                    : `▼ Show all ${lifeEvents.length} events`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCENE VIEW (full-screen location visit) ─────────────────────── */}
      {sceneLocation && (
        <SceneView
          location={sceneLocation}
          year={currentYear}
          playerCitizen={citizen}
          allCitizens={CITIZENS}
          onLeave={() => setSceneLocation(null)}
        />
      )}

      {showNewspaper && (
        <NewspaperModal
          year={currentYear}
          onClose={() => setShowNewspaper(false)}
        />
      )}
    </div>
  );
}

// ── LIFE EVENT ROW ─────────────────────────────────────────────────────────────

function LifeEventRow({ event, isLast, eraAccent }: { event: LifeEvent; isLast: boolean; eraAccent: string }) {
  const [expanded, setExpanded] = useState(false);
  const color = event.isSealed ? '#ddd' : TYPE_COLORS[event.type];

  return (
    <div
      onClick={() => !event.isSealed && event.description && setExpanded(e => !e)}
      style={{
        display: 'flex',
        gap: '14px',
        paddingBottom: '18px',
        cursor: event.isSealed || !event.description ? 'default' : 'pointer',
      }}
    >
      {/* Timeline line + dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18px', flexShrink: 0 }}>
        <div style={{ color, fontSize: '11px', lineHeight: 1, marginBottom: '4px', marginTop: '3px' }}>
          {event.isSealed ? '?' : TYPE_ICONS[event.type]}
        </div>
        {!isLast && (
          <div style={{ flex: 1, width: '1px', background: `${eraAccent}18`, minHeight: '16px' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
          <span style={{ color: '#bbb', fontSize: '10px', flexShrink: 0, letterSpacing: '1px' }}>
            {event.year}
          </span>
          <span style={{
            color: event.isSealed ? '#ddd' : color === '#888' ? '#777' : color,
            fontSize: '12px',
            fontWeight: 500,
          }}>
            {event.isSealed ? '████████ ████' : event.title}
          </span>
        </div>
        {!event.isSealed && event.description && (
          <p style={{
            color: '#999',
            fontSize: '11px',
            lineHeight: '1.6',
            margin: 0,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? undefined : 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          } as React.CSSProperties}>
            {event.description}
          </p>
        )}
        {event.isSealed && (
          <p style={{ color: '#e0e0e0', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
            A past decision is making its way to this life.
          </p>
        )}
      </div>
    </div>
  );
}

// ── BUILD LIFE EVENTS ──────────────────────────────────────────────────────────

function buildLifeEvents(
  citizen: Citizen,
  decisions: Decision[],
  ripples: Ripple[],
  currentYear: number,
): LifeEvent[] {
  const events: LifeEvent[] = [];

  events.push({
    year: citizen.birthYear,
    type: 'life',
    title: `${citizen.firstName} ${citizen.lastName} is born`,
    description: `Born in ${citizen.birthYear} in Crestfield. ${citizen.biography}`,
  });

  for (const d of decisions.filter(d => d.chosenOptionId && d.year <= currentYear)) {
    const chosen = d.options.find(o => o.id === d.chosenOptionId);
    events.push({
      year: d.year,
      type: 'decision',
      title: chosen?.label ?? 'A Decision',
      description: chosen?.outcomes.narrativeResult ?? '',
    });
  }

  for (const r of ripples.filter(r => r.isRevealed)) {
    events.push({
      year: r.resolvedYear ?? r.manifestYear,
      type: 'ripple',
      title: 'A Past Decision Arrives',
      description: r.resolvedNarrative ?? r.narrativeTemplate,
    });
  }

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

  events.sort((a, b) => a.year - b.year || (a.type === 'life' ? -1 : 1));
  return events;
}
