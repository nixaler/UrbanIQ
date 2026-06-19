import React, { useState } from 'react';
import type { Decision, DecisionOption, Family, Ripple } from '../types';

interface DecisionModalProps {
  decision: Decision;
  family: Family;
  triggeringRipple: Ripple | null;
  onChoose: (optionId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  loyalty_vs_integrity: 'Loyalty vs. Integrity',
  community_vs_ambition: 'Community vs. Ambition',
  truth_vs_protection: 'Truth vs. Protection',
  complicity_vs_consequence: 'Complicity vs. Consequence',
  forgiveness_vs_accountability: 'Forgiveness vs. Accountability',
  survival_vs_solidarity: 'Survival vs. Solidarity',
};

export function DecisionModal({ decision, family, triggeringRipple, onChoose }: DecisionModalProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [rippleCount, setRippleCount] = useState<number | null>(null);

  const handleChoose = (optionId: string) => {
    if (chosen) return;
    const option = decision.options.find(o => o.id === optionId);
    if (!option) return;

    setChosen(optionId);
    setRippleCount(option.outcomes.rippleSeeds.length);
    setTimeout(() => setShowResult(true), 600);
    setTimeout(() => onChoose(optionId), 2200);
  };

  const chosenOption = decision.options.find(o => o.id === chosen);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.92)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0a0a0a',
        border: `1px solid ${family.colorTheme}33`,
        borderRadius: '14px',
        padding: '32px',
      }}>
        {/* Ripple origin hint */}
        {triggeringRipple && (
          <div style={{
            background: '#FFB80011',
            border: '1px solid #FFB80033',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '24px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <span style={{ color: '#FFB800', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>◎</span>
            <span style={{ color: '#FFB80099', fontSize: '12px', lineHeight: '1.5' }}>
              This moment was shaped by a decision made in another life — someone whose path crossed yours before you knew it.
            </span>
          </div>
        )}

        {/* Category */}
        <div style={{
          color: family.colorTheme,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '16px',
          opacity: 0.8,
        }}>
          {CATEGORY_LABELS[decision.category]}
        </div>

        {/* Context */}
        <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.7', margin: '0 0 20px' }}>
          {decision.contextText}
        </p>

        {/* Prompt */}
        <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: 600, lineHeight: '1.5', margin: '0 0 28px' }}>
          {decision.prompt}
        </h2>

        {/* Options */}
        {!showResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {decision.options.map(option => (
              <OptionButton
                key={option.id}
                option={option}
                family={family}
                isChosen={chosen === option.id}
                isDimmed={chosen !== null && chosen !== option.id}
                isHovered={hoveredOption === option.id}
                onHover={() => setHoveredOption(option.id)}
                onLeave={() => setHoveredOption(null)}
                onChoose={() => handleChoose(option.id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Result */}
            <div style={{
              padding: '16px',
              background: '#111',
              borderRadius: '8px',
              borderLeft: `3px solid ${family.colorTheme}`,
              marginBottom: '16px',
            }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                {chosenOption?.label}
              </div>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                {chosenOption?.outcomes.narrativeResult}
              </p>
            </div>

            {/* Ripple animation */}
            {rippleCount !== null && rippleCount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: '#FFB80008',
                border: '1px solid #FFB80022',
                borderRadius: '8px',
                animation: 'fadeIn 0.3s ease 0.4s both',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid #FFB800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'ripplePulse 1s ease infinite',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFB800' }} />
                </div>
                <span style={{ color: '#FFB80099', fontSize: '12px' }}>
                  Your decision echoed outward into{' '}
                  <span style={{ color: '#FFB800', fontWeight: 700 }}>{rippleCount} other {rippleCount === 1 ? 'life' : 'lives'}</span>.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes ripplePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// ── OPTION BUTTON ─────────────────────────────────────────────────────────────

interface OptionButtonProps {
  option: DecisionOption;
  family: Family;
  isChosen: boolean;
  isDimmed: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onChoose: () => void;
}

function OptionButton({ option, family, isChosen, isDimmed, isHovered, onHover, onLeave, onChoose }: OptionButtonProps) {
  const border = isChosen
    ? `2px solid ${family.colorTheme}`
    : isHovered
    ? `1px solid ${family.colorTheme}66`
    : '1px solid #1e1e1e';

  const bg = isChosen ? `${family.colorTheme}11` : isHovered ? '#111' : '#0d0d0d';

  return (
    <button
      onClick={onChoose}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={isDimmed}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px 20px',
        background: bg,
        border,
        borderRadius: '8px',
        cursor: isDimmed ? 'default' : 'pointer',
        fontFamily: '"JetBrains Mono", monospace',
        opacity: isDimmed ? 0.35 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
        {option.label}
      </div>
      <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
        {option.description}
      </div>

      {/* Stat previews */}
      {isHovered && !isChosen && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', animation: 'fadeIn 0.15s ease' }}>
          {option.outcomes.wealthDelta !== 0 && (
            <StatDelta label="Wealth" value={option.outcomes.wealthDelta} />
          )}
          {option.outcomes.reputationDelta !== 0 && (
            <StatDelta label="Rep" value={option.outcomes.reputationDelta} />
          )}
        </div>
      )}
    </button>
  );
}

function StatDelta({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? '#4CAF50' : '#e53935';
  const sign = value > 0 ? '+' : '';
  return (
    <span style={{ fontSize: '11px', color }}>
      {label}: {sign}{value}
    </span>
  );
}
