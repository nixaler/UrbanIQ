import React, { useEffect, useState } from 'react';
import type { Citizen, Ripple } from '../types';

interface RippleRevealProps {
  ripple: Ripple;
  sourceCitizen: Citizen | null;
  onDismiss: () => void;
}

export function RippleReveal({ ripple, sourceCitizen, onDismiss }: RippleRevealProps) {
  const [stage, setStage] = useState<'thread' | 'text' | 'ready'>('thread');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('text'), 1000);
    const t2 = setTimeout(() => setStage('ready'), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const sourceName = sourceCitizen
    ? `${sourceCitizen.firstName} ${sourceCitizen.lastName}`
    : null;

  const yearDelta = ripple.resolvedYear
    ? ripple.resolvedYear - (ripple.createdAt ? new Date(ripple.createdAt).getFullYear() : ripple.resolvedYear)
    : null;

  return (
    <div
      onClick={stage === 'ready' ? onDismiss : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.96)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        fontFamily: '"JetBrains Mono", monospace',
        cursor: stage === 'ready' ? 'pointer' : 'default',
      }}
    >
      {/* Animated ripple graphic */}
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '32px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid #FFB800',
              opacity: 0,
              animation: `rippleExpand 2s ease ${i * 0.5}s infinite`,
            }}
          />
        ))}
        <div style={{
          position: 'absolute',
          inset: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#FFB800',
          boxShadow: '0 0 20px #FFB80066',
        }} />
      </div>

      {/* Text content */}
      <div style={{
        maxWidth: '480px',
        textAlign: 'center',
        opacity: stage === 'thread' ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}>
        <div style={{ color: '#FFB800', fontSize: '11px', letterSpacing: '4px', marginBottom: '16px', textTransform: 'uppercase' }}>
          A Past Decision Arrives
        </div>

        {sourceName ? (
          <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7', margin: '0 0 12px' }}>
            {yearDelta && yearDelta > 0
              ? `${yearDelta} ${yearDelta === 1 ? 'year' : 'years'} ago, `
              : ''
            }
            <strong style={{ color: '#fff' }}>{sourceName}</strong> made a decision that has just arrived in your life.
          </p>
        ) : (
          <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7', margin: '0 0 12px' }}>
            A decision made in another life has just found its way into yours.
          </p>
        )}

        <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.6', margin: '0 0 24px' }}>
          {ripple.resolvedNarrative ?? ripple.narrativeTemplate}
        </p>

        {stage === 'ready' && (
          <div style={{
            color: '#444',
            fontSize: '11px',
            letterSpacing: '2px',
            animation: 'fadeIn 0.4s ease',
          }}>
            TAP TO CONTINUE
          </div>
        )}
      </div>

      <style>{`
        @keyframes rippleExpand {
          0% { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
