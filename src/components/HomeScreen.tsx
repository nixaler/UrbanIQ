import React from 'react';
import { GameMode } from '../types';

interface HomeScreenProps {
  onStartGame: (mode: GameMode) => void;
  onViewChange: (view: 'home' | 'game' | 'battle' | 'collection' | 'leaderboard') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, onViewChange }) => {
  const gameModes = [
    { id: 'dc' as GameMode, name: 'Washington DC', description: 'Metro stations', icon: '🚇' },
    { id: 'pdx' as GameMode, name: 'Portland', description: 'MAX light rail', icon: '🚊' },
    { id: 'balt' as GameMode, name: 'Baltimore', description: 'Metro subway', icon: '🚇' },
    { id: 'la' as GameMode, name: 'Los Angeles', description: 'Metro rail', icon: '🚇' },
    { id: 'states' as GameMode, name: 'US States', description: 'Geography puzzle', icon: '🗺️' },
    { id: 'nfl' as GameMode, name: 'NFL Teams', description: 'Football teams', icon: '🏈' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '20px',
      paddingBottom: '80px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated circle background */}
      <div aria-hidden="true" style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2,138,72,0.15) 0%, transparent 70%)',
          top: '-20%',
          left: '-15%',
          animation: 'blob1 24s ease-in-out infinite',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,58,143,0.18) 0%, transparent 70%)',
          top: '25%',
          right: '-15%',
          animation: 'blob2 30s ease-in-out infinite',
          filter: 'blur(65px)'
        }} />
        <div style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(191,0,0,0.12) 0%, transparent 70%)',
          bottom: '-15%',
          left: '20%',
          animation: 'blob3 36s ease-in-out infinite',
          filter: 'blur(70px)'
        }} />
        <div style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(113,58,237,0.12) 0%, transparent 70%)',
          top: '60%',
          right: '15%',
          animation: 'blob1 20s ease-in-out infinite reverse',
          filter: 'blur(55px)'
        }} />
        <style>{`
          @keyframes blob1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(50px, -50px) scale(1.1); }
            50% { transform: translate(-50px, 50px) scale(0.9); }
            75% { transform: translate(50px, 50px) scale(1.05); }
          }
          @keyframes blob2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-30px, 30px) scale(1.15); }
            66% { transform: translate(30px, -30px) scale(0.95); }
          }
          @keyframes blob3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-40px, -40px) scale(1.2); }
          }
        `}</style>
      </div>

      {/* Header - Overlaying on top of circles */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        marginBottom: 40,
        color: 'white',
        marginTop: 40
      }}>
        <h1 style={{
          fontSize: 72,
          fontWeight: 900,
          margin: '0 0 8px 0',
          fontFamily: 'Cinzel, serif',
          background: 'linear-gradient(90deg, #028A48, #4a6fff, #BF0000, #028A48)',
          backgroundSize: '300% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: 'shimmer 5s linear infinite',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 20px rgba(74, 111, 255, 0.3))'
        }}>
          UrbanIQ
        </h1>
        <p style={{
          fontSize: 18,
          margin: 0,
          opacity: 0.9,
          letterSpacing: 3,
          textTransform: 'uppercase',
          fontWeight: 300
        }}>
          Daily Transit & Geography Puzzles
        </p>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 0% center; }
            100% { background-position: 300% center; }
          }
        `}</style>
      </div>

      {/* Game Mode Selection */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <h2 style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: 24,
          marginBottom: 20,
          textAlign: 'center',
          letterSpacing: 2,
          textTransform: 'uppercase'
        }}>
          Choose Your Challenge
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 16
        }}>
          {gameModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onStartGame(mode.id)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: 48 }}>{mode.icon}</span>
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: 'white'
              }}>
                {mode.name}
              </h3>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)'
              }}>
                {mode.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: 800,
        margin: '40px auto 0',
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => onViewChange('battle')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        >
          ⚔️ PvP Battle
        </button>
        
        <button
          onClick={() => onViewChange('collection')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        >
          🃏 Card Collection
        </button>
        
        <button
          onClick={() => onViewChange('leaderboard')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        >
          🏆 Leaderboard
        </button>
      </div>
    </div>
  );
};