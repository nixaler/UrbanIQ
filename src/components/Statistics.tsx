import React, { useState, useEffect } from 'react';

interface StatisticsData {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  bestScore: number;
  gamesByMode: Record<string, number>;
  recentGames: Array<{
    mode: string;
    result: 'win' | 'loss';
    score: number;
    date: string;
  }>;
}

export const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatisticsData>({
    totalGamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageScore: 0,
    bestScore: 0,
    gamesByMode: {},
    recentGames: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    // In a real app, this would fetch from an API
    const savedStats = localStorage.getItem('urbanIQ_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    setIsLoading(false);
  };

  const winRate = stats.totalGamesPlayed > 0 
    ? Math.round((stats.totalWins / stats.totalGamesPlayed) * 100) 
    : 0;

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: 800,
      margin: '0 auto',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h2 style={{
        fontSize: 32,
        fontWeight: 700,
        marginBottom: 24,
        color: '#1a1a1a'
      }}>
        📊 Your Statistics
      </h2>

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <StatCard
          label="Games Played"
          value={stats.totalGamesPlayed}
          icon="🎮"
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          icon="📈"
        />
        <StatCard
          label="Current Streak"
          value={stats.currentStreak}
          icon="🔥"
        />
        <StatCard
          label="Best Score"
          value={stats.bestScore}
          icon="⭐"
        />
      </div>

      {/* Games by Mode */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          Games by Mode
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(stats.gamesByMode).map(([mode, count]) => (
            <div key={mode} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ textTransform: 'capitalize', color: '#666' }}>
                {mode}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 200,
                  height: 8,
                  background: '#f0f0f0',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(count / stats.totalGamesPlayed) * 100}%`,
                    height: '100%',
                    background: '#0060A9',
                    borderRadius: 4
                  }} />
                </div>
                <span style={{ fontWeight: 600, minWidth: 30 }}>
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Games */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          Recent Games
        </h3>
        {stats.recentGames.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.recentGames.map((game, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: index % 2 === 0 ? '#f8f9fa' : 'white',
                borderRadius: 8
              }}>
                <div>
                  <span style={{
                    textTransform: 'capitalize',
                    fontWeight: 500,
                    marginRight: 12
                  }}>
                    {game.mode}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: '#999'
                  }}>
                    {new Date(game.date).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{
                    fontWeight: 600,
                    color: game.result === 'win' ? '#10b981' : '#ef4444'
                  }}>
                    {game.result === 'win' ? '✓ Win' : '✗ Loss'}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {game.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>
            No games played yet
          </p>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div style={{
    background: 'white',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease'
  }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
    <div style={{
      fontSize: 28,
      fontWeight: 700,
      color: '#0060A9',
      marginBottom: 4
    }}>
      {value}
    </div>
    <div style={{
      fontSize: 12,
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: 0.5
    }}>
      {label}
    </div>
  </div>
);