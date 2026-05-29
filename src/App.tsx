import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { Navigation } from './components/Navigation';
import { HomeScreen } from './components/HomeScreen';
import { Statistics } from './components/Statistics';
import { Tutorial } from './components/Tutorial';
import { Settings } from './components/Settings';
import { useGameState } from './hooks/useGameState';
import { useBattle } from './hooks/useBattle';
import { GameMode } from './types';
import { storageCache } from './utils/performance';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'game' | 'battle' | 'collection' | 'leaderboard'>('home');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const gameState = useGameState();
  const battle = useBattle();

  useEffect(() => {
    // Check if user has seen tutorial
    const hasSeenTutorial = storageCache.get('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
    
    // Simulate initial loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleStartGame = (mode: GameMode) => {
    gameState.startGame(mode);
    setCurrentView('game');
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    storageCache.set('hasSeenTutorial', true);
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    storageCache.set('hasSeenTutorial', true);
  };

  if (isLoading) {
    return <Loading message="Loading UrbanIQ..." />;
  }

  return (
    <ErrorBoundary>
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Main Content */}
        <main style={{
          paddingBottom: 80 // Space for navigation
        }}>
          {currentView === 'home' && (
            <HomeScreen
              onStartGame={handleStartGame}
              onViewChange={setCurrentView}
            />
          )}
          
          {currentView === 'game' && (
            <div style={{
              padding: '20px',
              maxWidth: 800,
              margin: '0 auto'
            }}>
              <h2>Game Mode</h2>
              <p>Current mode: {gameState.gameState.currentMode}</p>
              <p>Score: {gameState.gameState.score}</p>
              <button onClick={() => gameState.resetGame()}>
                Reset Game
              </button>
            </div>
          )}
          
          {currentView === 'battle' && (
            <div style={{
              padding: '20px',
              maxWidth: 800,
              margin: '0 auto'
            }}>
              <h2>PvP Battle</h2>
              <p>Battle functionality coming soon!</p>
              <p>Current battle status: {battle.battleRecord?.status || 'No active battle'}</p>
            </div>
          )}
          
          {currentView === 'collection' && (
            <div style={{
              padding: '20px',
              maxWidth: 800,
              margin: '0 auto'
            }}>
              <h2>Card Collection</h2>
              <p>Collection functionality coming soon!</p>
            </div>
          )}
          
          {currentView === 'leaderboard' && (
            <Statistics />
          )}
        </main>

        {/* Navigation */}
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Tutorial Modal */}
        {showTutorial && (
          <Tutorial
            onComplete={handleTutorialComplete}
            skipTutorial={handleSkipTutorial}
          />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'white',
            border: '2px solid #e0e0e0',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 100
          }}
        >
          ⚙️
        </button>
      </div>
    </ErrorBoundary>
  );
}

export default App;