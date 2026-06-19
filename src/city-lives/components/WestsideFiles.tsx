import React, { useState } from 'react';
import type { WestsideEvidence, WestsideFilesState } from '../types';
import { WESTSIDE_EVIDENCE } from '../data/decisions';

interface WestsideFilesProps {
  state: WestsideFilesState;
  onBack: () => void;
}

export function WestsideFiles({ state, onBack }: WestsideFilesProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<WestsideEvidence | null>(null);

  const evidenceWithState = WESTSIDE_EVIDENCE.map(ev => ({
    ...ev,
    isCollected: state.collectedEvidence.includes(ev.key),
  }));

  const collectedCount = evidenceWithState.filter(e => e.isCollected).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#fff',
      fontFamily: '"JetBrains Mono", monospace',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', padding: 0, marginBottom: '16px' }}
          >
            ← Back to City
          </button>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            The Westside Files
          </h1>
          <p style={{ color: '#555', fontSize: '13px', margin: '8px 0 0' }}>
            Crestfield, 1972. A neighborhood was demolished. A woman disappeared. The city moved on.
          </p>
          <div style={{ marginTop: '16px', color: '#FFB800', fontSize: '13px' }}>
            {collectedCount} of {evidenceWithState.length} pieces collected
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '8px', height: '3px', background: '#1a1a1a', borderRadius: '2px' }}>
            <div style={{
              height: '100%',
              width: `${(collectedCount / evidenceWithState.length) * 100}%`,
              background: '#FFB800',
              transition: 'width 0.5s ease',
              borderRadius: '2px',
            }} />
          </div>
        </div>

        {/* Evidence grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {evidenceWithState.map(ev => (
            <EvidenceCard
              key={ev.key}
              evidence={ev}
              onSelect={() => ev.isCollected ? setSelectedEvidence(ev) : null}
            />
          ))}
        </div>

        {/* Complete message */}
        {state.isComplete && (
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: '#FFB80008',
            border: '1px solid #FFB80033',
            borderRadius: '10px',
          }}>
            <div style={{ color: '#FFB800', fontWeight: 700, marginBottom: '8px' }}>The Full Picture</div>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
              All six pieces are collected. Sofia Morozov was not a missing person — she was imprisoned on the orders of William Caldwell, facilitated by Captain Harlow, signed into being by Wei Chen, and buried in silence by James Webb Sr., Esperanza Reyes, and the Caldwell family archive.
            </p>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.7', margin: '12px 0 0' }}>
              She is alive. She is{' '}
              <span style={{ color: '#fff' }}>Leila Hassan's</span>{' '}
              biological mother. She lives under the name Sarah Morris, in another city, and she thinks about Crestfield every day.
            </p>
          </div>
        )}
      </div>

      {/* Document viewer modal */}
      {selectedEvidence && (
        <DocumentViewer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      )}
    </div>
  );
}

// ── EVIDENCE CARD ─────────────────────────────────────────────────────────────

function EvidenceCard({ evidence, onSelect }: { evidence: WestsideEvidence & { isCollected: boolean }; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      disabled={!evidence.isCollected}
      style={{
        width: '100%',
        textAlign: 'left',
        background: evidence.isCollected ? '#0d0d0d' : '#080808',
        border: `1px solid ${evidence.isCollected ? '#2a2a2a' : '#111'}`,
        borderRadius: '10px',
        padding: '20px',
        cursor: evidence.isCollected ? 'pointer' : 'default',
        fontFamily: '"JetBrains Mono", monospace',
        transition: 'border-color 0.2s ease',
      }}
    >
      {evidence.isCollected ? (
        <>
          <div style={{ color: '#FFB800', fontSize: '10px', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>
            {evidence.sourceFamily} family · {evidence.year}
          </div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
            {evidence.title}
          </div>
          <div style={{ color: '#666', fontSize: '11px' }}>
            {evidence.unlockCondition}
          </div>
        </>
      ) : (
        <>
          <div style={{
            height: '8px', width: '60px', background: '#1a1a1a',
            borderRadius: '4px', marginBottom: '10px'
          }} />
          <div style={{ color: '#333', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            ████████████
          </div>
          <div style={{ color: '#333', fontSize: '11px' }}>
            {evidence.unlockCondition}
          </div>
        </>
      )}
    </button>
  );
}

// ── DOCUMENT VIEWER ───────────────────────────────────────────────────────────

function DocumentViewer({ evidence, onClose }: { evidence: WestsideEvidence; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: '#0d0d0d',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '32px',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        <div style={{ color: '#FFB800', fontSize: '10px', letterSpacing: '3px', marginBottom: '16px', textTransform: 'uppercase' }}>
          Evidence · {evidence.year}
        </div>
        <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 24px', fontWeight: 600 }}>
          {evidence.title}
        </h2>

        {/* Document text */}
        <div style={{
          background: '#070707',
          border: '1px solid #1a1a1a',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '20px',
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: '#bbb',
          lineHeight: '1.8',
          whiteSpace: 'pre-line',
        }}>
          {evidence.documentText}
        </div>

        {/* Forensic note */}
        <div style={{ padding: '16px', borderLeft: '3px solid #FFB80055', paddingLeft: '20px' }}>
          <div style={{ color: '#FFB800', fontSize: '10px', letterSpacing: '2px', marginBottom: '6px', textTransform: 'uppercase' }}>
            What This Reveals
          </div>
          <p style={{ color: '#777', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
            {evidence.forensicNote}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '24px',
            width: '100%',
            background: 'none',
            border: '1px solid #2a2a2a',
            color: '#555',
            padding: '10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
