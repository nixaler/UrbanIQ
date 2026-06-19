import React, { useState } from 'react';
import { DISTRICTS, LOCATIONS, getDistrictState, HISTORICAL_EVENTS } from '../data/crestfield';
import { FAMILIES, CITIZENS } from '../data/families';

interface CityMapProps {
  onBack: () => void;
  playedCitizenIds?: string[];
}

const FAMILY_DISTRICT_MAP: Record<string, string> = {
  caldwell: 'heights',
  reyes: 'westside',
  webb: 'portside',
  morozov: 'westside',
  chen: 'westside',
  washington: 'westside',
};

export function CityMap({ onBack, playedCitizenIds = [] }: CityMapProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [year, setYear] = useState(1950);

  const activeDistrict = DISTRICTS.find(d => d.id === selectedDistrict);

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
            Crestfield City Map
          </h1>
          <p style={{ margin: '2px 0 0', color: '#aaa', fontSize: '11px' }}>
            Explore the neighborhoods, their histories, and who lived where.
          </p>
        </div>
      </div>

      {/* Year scrubber */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: '#fafafa',
      }}>
        <span style={{ fontSize: '11px', color: '#888', letterSpacing: '2px', whiteSpace: 'nowrap' }}>YEAR:</span>
        <input
          type="range"
          min={1920}
          max={2025}
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          style={{ flex: 1, maxWidth: '300px', accentColor: '#B8860B' }}
        />
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#B8860B', minWidth: '52px' }}>{year}</span>
        <div style={{ fontSize: '11px', color: '#aaa', marginLeft: 'auto' }}>
          {HISTORICAL_EVENTS.find(e => e.year === year)?.title ?? 'No major event this year'}
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
        {/* District grid */}
        <div style={{
          flex: selectedDistrict ? '0 0 340px' : '1',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: selectedDistrict ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
          alignContent: 'start',
          transition: 'flex 0.3s ease',
          overflowY: 'auto',
        }}>
          {DISTRICTS.map(district => {
            const state = getDistrictState(district.id, year);
            const isSelected = selectedDistrict === district.id;

            // Which families live here?
            const familiesHere = FAMILIES.filter(f => FAMILY_DISTRICT_MAP[f.id] === district.id);

            // Active locations here
            const activeLocations = LOCATIONS.filter(
              loc => loc.districtId === district.id &&
              loc.activeYearStart <= year &&
              (loc.activeYearEnd === null || loc.activeYearEnd >= year)
            );

            return (
              <button
                key={district.id}
                onClick={() => setSelectedDistrict(isSelected ? null : district.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isSelected ? '#f0f0f0' : '#fafafa',
                  border: `1px solid ${isSelected ? '#999' : '#e8e8e8'}`,
                  borderRadius: '10px',
                  padding: '18px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#111', marginBottom: '2px' }}>
                      {state.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {district.character}
                    </div>
                  </div>
                  <WealthDots tier={state.wealthTier} />
                </div>

                <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.6', margin: '10px 0 10px', display: isSelected ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {state.description}
                </p>

                {/* Family dots */}
                {familiesHere.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {familiesHere.map(f => (
                      <div
                        key={f.id}
                        title={`${f.familyName} family`}
                        style={{
                          width: '8px', height: '8px',
                          borderRadius: '50%',
                          background: f.colorTheme,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Location count */}
                {activeLocations.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#bbb', letterSpacing: '1px' }}>
                    {activeLocations.length} {activeLocations.length === 1 ? 'location' : 'locations'} active
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* District detail panel */}
        {selectedDistrict && activeDistrict && (
          <DistrictDetail
            district={activeDistrict}
            year={year}
            playedCitizenIds={playedCitizenIds}
            onClose={() => setSelectedDistrict(null)}
          />
        )}
      </div>
    </div>
  );
}

// ── DISTRICT DETAIL ────────────────────────────────────────────────────────────

function DistrictDetail({ district, year, playedCitizenIds, onClose }: {
  district: typeof DISTRICTS[0];
  year: number;
  playedCitizenIds: string[];
  onClose: () => void;
}) {
  const state = getDistrictState(district.id, year);

  const activeLocations = LOCATIONS.filter(
    loc => loc.districtId === district.id &&
    loc.activeYearStart <= year &&
    (loc.activeYearEnd === null || loc.activeYearEnd >= year)
  );

  const historicalNote = district.historicalNotes.find(note => {
    const match = note.match(/\d{4}/);
    if (!match) return false;
    const noteYear = parseInt(match[0]);
    return noteYear <= year;
  });

  const citizensHere = CITIZENS.filter(c => c.districtId === district.id && c.isPlayable);

  return (
    <div style={{
      flex: 1,
      borderLeft: '1px solid #e8e8e8',
      padding: '24px',
      overflowY: 'auto',
      animation: 'fadeIn 0.2s ease',
    }}>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', padding: '0 0 16px', letterSpacing: '2px' }}
      >
        ← DISTRICTS
      </button>

      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#111' }}>
        {state.name}
      </h2>
      <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {district.character} · Crestfield, {year}
      </div>

      <p style={{ color: '#444', fontSize: '13px', lineHeight: '1.8', margin: '0 0 20px' }}>
        {state.description}
      </p>

      {historicalNote && (
        <div style={{
          background: '#fafafa',
          border: '1px solid #e8e8e8',
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '20px',
          fontSize: '11px',
          color: '#888',
          lineHeight: '1.6',
        }}>
          {historicalNote}
        </div>
      )}

      {/* Active locations */}
      {activeLocations.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Active Locations in {year}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {activeLocations.map(loc => (
              <div key={loc.id} style={{
                padding: '12px 14px',
                background: '#fafafa',
                border: '1px solid #ebebeb',
                borderRadius: '8px',
              }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#111', marginBottom: '2px' }}>{loc.name}</div>
                <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.5' }}>{loc.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters */}
      {citizensHere.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Residents (Characters)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {citizensHere.map(c => {
              const played = playedCitizenIds.includes(c.id);
              const family = FAMILIES.find(f => f.id === c.familyId);
              return (
                <div key={c.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: '1px solid #ebebeb',
                  borderRadius: '6px',
                  opacity: played ? 1 : 0.7,
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: family?.colorTheme ?? '#ccc',
                    flexShrink: 0,
                  }} />
                  <div>
                    <span style={{ fontSize: '13px', color: played ? '#111' : '#888' }}>
                      {c.firstName} {c.lastName}
                    </span>
                    <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '8px' }}>
                      b. {c.birthYear}
                    </span>
                  </div>
                  {played && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#4CAF50' }}>played</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── WEALTH DOTS ────────────────────────────────────────────────────────────────

function WealthDots({ tier }: { tier: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: i <= tier ? '#B8860B' : '#e8e8e8',
        }} />
      ))}
    </div>
  );
}
