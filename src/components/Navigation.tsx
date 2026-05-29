import React from 'react';

interface NavigationProps {
  currentView: 'home' | 'game' | 'battle' | 'collection' | 'leaderboard';
  onViewChange: (view: 'home' | 'game' | 'battle' | 'collection' | 'leaderboard') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: '🏠' },
    { id: 'game' as const, label: 'Play', icon: '🎮' },
    { id: 'battle' as const, label: 'Battle', icon: '⚔️' },
    { id: 'collection' as const, label: 'Cards', icon: '🃏' },
    { id: 'leaderboard' as const, label: 'Ranks', icon: '🏆' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0',
      zIndex: 1000,
      '@media (min-width: 768px)': {
        position: 'sticky',
        top: 0,
        bottom: 'auto',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }
    }}>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 8,
            transition: 'all 0.2s ease',
            opacity: currentView === item.id ? 1 : 0.6,
            color: currentView === item.id ? '#0060A9' : '#666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,96,169,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <span style={{ fontSize: 24 }}>{item.icon}</span>
          <span style={{
            fontSize: 12,
            fontWeight: currentView === item.id ? 600 : 400,
            fontFamily: 'Inter, sans-serif'
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};