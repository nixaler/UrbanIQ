import React from 'react';
import { HISTORICAL_EVENTS } from '../data/crestfield';

interface NewspaperModalProps {
  year: number;
  onClose: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getDateString(year: number): string {
  const day = DAYS[year % 7];
  const month = MONTHS[(year * 3 + 7) % 12];
  const date = 1 + (year % 28);
  return `${day}, ${month} ${date}, ${year}`;
}

const QUIET_YEARS: string[] = [
  'The city goes about its business.',
  'Another ordinary day in Crestfield.',
  'Quiet news from City Hall.',
  'The port moves its shipments. The neighborhood opens its shops.',
  'Spring in Crestfield.',
  'A Tuesday in the city.',
];

export function NewspaperModal({ year, onClose }: NewspaperModalProps) {
  const event = HISTORICAL_EVENTS.find(e => e.year === year);
  const headline = event?.title ?? null;
  const article = event?.description ?? null;

  const quietHeadline = QUIET_YEARS[year % QUIET_YEARS.length];

  // Price per era
  const price = year < 1945 ? '2 Cents'
    : year < 1970 ? '5 Cents'
    : year < 1990 ? '25 Cents'
    : year < 2005 ? '50 Cents'
    : '75 Cents';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: '#FDF8F0',
          borderRadius: '4px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Masthead */}
        <div style={{
          borderBottom: '3px double #111',
          padding: '20px 28px 16px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '9px',
            letterSpacing: '3px',
            color: '#666',
            textTransform: 'uppercase',
            marginBottom: '6px',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            Est. 1931 · {price} · {getDateString(year)}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 900,
            color: '#111',
            letterSpacing: '-1px',
            lineHeight: 1,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            THE CRESTFIELD COURIER
          </div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '2px',
            color: '#666',
            marginTop: '6px',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            ALL THE NEWS THAT'S FIT TO PRINT
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px 28px' }}>
          {headline ? (
            <>
              {/* Category label */}
              <div style={{
                fontSize: '8px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#888',
                marginBottom: '8px',
                fontFamily: '"JetBrains Mono", monospace',
                borderTop: '1px solid #ccc',
                paddingTop: '12px',
              }}>
                City News
              </div>

              {/* Headline */}
              <h2 style={{
                margin: '0 0 12px',
                fontSize: '24px',
                fontWeight: 700,
                lineHeight: '1.3',
                color: '#111',
              }}>
                {headline}
              </h2>

              {/* Dateline */}
              <div style={{
                fontSize: '11px',
                color: '#888',
                marginBottom: '16px',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                CRESTFIELD, {year}
              </div>

              {/* Article text */}
              <p style={{
                margin: '0 0 16px',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#333',
                textAlign: 'justify',
              }}>
                {article}
              </p>

              {/* Pull quote / editorial aside */}
              <div style={{
                borderLeft: '3px solid #ccc',
                paddingLeft: '16px',
                margin: '16px 0',
                fontStyle: 'italic',
                color: '#666',
                fontSize: '13px',
                lineHeight: '1.7',
              }}>
                "The city continues to grow, to change, and to face the choices that growth always brings."
                <div style={{ fontStyle: 'normal', fontSize: '11px', marginTop: '4px', color: '#aaa', fontFamily: '"JetBrains Mono", monospace' }}>
                  — The Editors
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontSize: '8px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#888',
                marginBottom: '12px',
                fontFamily: '"JetBrains Mono", monospace',
                borderTop: '1px solid #ccc',
                paddingTop: '12px',
              }}>
                City Desk
              </div>
              <h2 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 700, color: '#111' }}>
                {quietHeadline}
              </h2>
              <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
                Crestfield, {year}. The week's news from City Hall, the waterfront, and the neighborhoods.
                Council meetings scheduled. Port operations normal. The schools report enrollment up from last year.
                Weather continues seasonable.
              </p>
            </>
          )}

          {/* Classifieds footer */}
          <div style={{
            borderTop: '2px solid #111',
            marginTop: '24px',
            paddingTop: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}>
            {[
              'ROOMS TO LET — Portside, reasonable.',
              'EXPERIENCED COOK seeks work, references.',
              'LOST: A brown dog on Market St.',
              'PIANO LESSONS offered, Miss E. Park.',
            ].map((ad, i) => (
              <div key={i} style={{ fontSize: '10px', color: '#777', fontFamily: '"JetBrains Mono", monospace', lineHeight: '1.4' }}>
                {ad}
              </div>
            ))}
          </div>
        </div>

        {/* Close */}
        <div style={{ padding: '0 28px 24px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: '4px',
              color: '#888',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '1px',
            }}
          >
            PUT DOWN THE PAPER
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
