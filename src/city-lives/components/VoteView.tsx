import React, { useState } from 'react';
import type { Citizen, Family } from '../types';

interface VoteViewProps {
  citizen: Citizen;
  family: Family;
  onVote: (choice: 'yes' | 'no') => void;
  onSkip: () => void;
}

const VOTER_CONTEXTS: Record<string, string> = {
  keisha_washington: 'As a city council member, your vote is binding and public. Every constituent will know what you chose.',
  ana_reyes: 'As a civil rights attorney, you can file a legal challenge that delays the vote — or stay focused on other cases.',
  marcus_webb: 'The development company holds Caldwell security contracts. You\'ve seen documents that no one else has. You can expose the conflicts of interest — or stay quiet.',
  maya_chen: 'Your architecture thesis critiques this exact project. Publishing it now could shift public opinion. Or you could accept the job offer from Caldwell\'s firm.',
  rosa_reyes: 'You have the story. Publishing it before the vote could change everything. But you need more time to verify.',
  claire_caldwell: 'Your father helped design this project. Confronting him about the family\'s history would mean asking questions he\'s never had to answer.',
};

const YES_LABELS: Record<string, string> = {
  keisha_washington: 'Vote yes — approve the development',
  ana_reyes: 'Accept the negotiated terms and move on',
  marcus_webb: 'Stay quiet — the institution comes first',
  maya_chen: 'Accept the job, shelve the thesis',
  rosa_reyes: 'Wait — hold the story until it\'s airtight',
  claire_caldwell: 'Accept your father\'s explanation',
};

const NO_LABELS: Record<string, string> = {
  keisha_washington: 'Vote no — block the development',
  ana_reyes: 'File the legal challenge',
  marcus_webb: 'Bring the documents forward',
  maya_chen: 'Publish the thesis, turn down the job',
  rosa_reyes: 'Publish now — the city needs to know',
  claire_caldwell: 'Demand the truth about the Westside archive',
};

export function VoteView({ citizen, family, onVote, onSkip }: VoteViewProps) {
  const [chosen, setChosen] = useState<'yes' | 'no' | null>(null);
  const [showResult, setShowResult] = useState(false);

  const context = VOTER_CONTEXTS[citizen.id] ?? 'The city is watching. What you do here will echo.';
  const yesLabel = YES_LABELS[citizen.id] ?? 'Support the development';
  const noLabel = NO_LABELS[citizen.id] ?? 'Oppose the development';

  const handleVote = (choice: 'yes' | 'no') => {
    setChosen(choice);
    setTimeout(() => setShowResult(true), 700);
    setTimeout(() => onVote(choice), 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0d0d0d',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      fontFamily: '"JetBrains Mono", monospace',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '580px',
        animation: 'fadeIn 0.6s ease',
      }}>
        {/* Year badge */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{ color: '#B8860B', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Crestfield · 2024
          </div>
          <div style={{
            display: 'inline-block',
            border: '1px solid #B8860B44',
            borderRadius: '4px',
            padding: '4px 16px',
            color: '#B8860B',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            The New Westside Development Vote
          </div>
        </div>

        {/* What's at stake */}
        <div style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px' }}>
            Oliver Caldwell and Daniel Chen's development firm is proposing to demolish what remains of the original Westside neighborhood — the last intact block that survived 1973 — for a "sustainable mixed-use development." 340 new families will be displaced if approved.
          </p>
          <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px' }}>
            The vote is tonight.
          </p>
          <div style={{
            borderTop: '1px solid #1a1a1a',
            paddingTop: '16px',
            color: '#ccc',
            fontSize: '13px',
            lineHeight: '1.7',
          }}>
            {context}
          </div>
        </div>

        {/* Character */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '12px 16px',
          background: '#111',
          borderRadius: '8px',
          border: '1px solid #1a1a1a',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: family.colorTheme,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '13px', fontWeight: 700,
            flexShrink: 0,
          }}>
            {citizen.firstName[0]}{citizen.lastName[0]}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
              {citizen.firstName} {citizen.lastName}
            </div>
            <div style={{ color: '#555', fontSize: '11px' }}>
              {citizen.currentCareer?.title ?? 'Unknown'} · {family.familyName} family
            </div>
          </div>
        </div>

        {!showResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <VoteOption
              label={noLabel}
              description="Stand against the development."
              color="#4CAF50"
              chosen={chosen === 'no'}
              dimmed={chosen === 'yes'}
              onChoose={() => handleVote('no')}
            />
            <VoteOption
              label={yesLabel}
              description="Accept what is happening."
              color="#e53935"
              chosen={chosen === 'yes'}
              dimmed={chosen === 'no'}
              onChoose={() => handleVote('yes')}
            />
            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#333',
                fontFamily: 'inherit',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '8px',
                textAlign: 'center',
                letterSpacing: '1px',
              }}
            >
              Return to this later
            </button>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center' }}>
            <div style={{
              padding: '24px',
              background: chosen === 'no' ? '#0a1a0a' : '#1a0a0a',
              border: `1px solid ${chosen === 'no' ? '#4CAF5033' : '#e5393533'}`,
              borderRadius: '10px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: '11px',
                color: chosen === 'no' ? '#4CAF50' : '#e53935',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                {chosen === 'no' ? 'You stood against it' : 'You let it happen'}
              </div>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                {chosen === 'no'
                  ? 'The city remembers who stood up when it mattered. The fight is not over — but this moment was yours.'
                  : 'The city moves on. It always does. The question is whether you can.'}
              </p>
            </div>
            <div style={{ color: '#333', fontSize: '11px', letterSpacing: '2px' }}>
              CONTINUING…
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

// ── VOTE OPTION ───────────────────────────────────────────────────────────────

function VoteOption({ label, description, color, chosen, dimmed, onChoose }: {
  label: string;
  description: string;
  color: string;
  chosen: boolean;
  dimmed: boolean;
  onChoose: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onChoose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={dimmed}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '18px 20px',
        background: chosen ? `${color}15` : hovered ? '#1a1a1a' : '#111',
        border: `1px solid ${chosen ? color + '66' : hovered ? '#333' : '#1a1a1a'}`,
        borderRadius: '10px',
        cursor: dimmed ? 'default' : 'pointer',
        fontFamily: '"JetBrains Mono", monospace',
        opacity: dimmed ? 0.3 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ color: chosen ? color : '#ddd', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ color: '#555', fontSize: '12px' }}>
        {description}
      </div>
    </button>
  );
}
