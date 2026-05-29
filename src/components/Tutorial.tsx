import React, { useState } from 'react';

interface TutorialProps {
  onComplete: () => void;
  skipTutorial: () => void;
}

interface TutorialStep {
  title: string;
  content: string;
  image?: string;
}

export const Tutorial: React.FC<TutorialProps> = ({ onComplete, skipTutorial }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      title: 'Welcome to UrbanIQ! 🎉',
      content: 'A daily puzzle game where you guess transit stations, US states, and NFL teams. Complete challenges to collect powerful cards and battle other players!'
    },
    {
      title: 'How to Play 🎮',
      content: 'Each day you get 3 rounds to guess the target. Use the hints provided and make your guesses wisely. Fewer guesses = higher scores!'
    },
    {
      title: 'Collect Cards 🃏',
      content: 'Win games to collect cards with different rarities: Common, Uncommon, Rare, and Legendary. Each card has unique abilities that can help you in puzzles or battles.'
    },
    {
      title: 'Card Abilities ⚡',
      content: 'Cards have special abilities like revealing hints, boosting your battle power, or sabotaging opponents. Use them strategically to gain an advantage!'
    },
    {
      title: 'PvP Battles ⚔️',
      content: 'Build a deck of 5 cards and battle against other players! Your cards\' power and abilities determine the outcome. Win to climb the leaderboard!'
    },
    {
      title: 'Ready to Play? 🚀',
      content: 'You now know the basics. Choose your game mode and start your UrbanIQ journey. Good luck!'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        maxWidth: 500,
        width: '100%',
        padding: 32,
        position: 'relative',
        animation: 'slideIn 0.3s ease'
      }}>
        {/* Close button */}
        <button
          onClick={skipTutorial}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#999',
            padding: 4
          }}
        >
          ×
        </button>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: 4,
                background: index <= currentStep ? '#0060A9' : '#e0e0e0',
                borderRadius: 2,
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 16,
            color: '#1a1a1a',
            fontFamily: 'Cinzel, serif'
          }}>
            {steps[currentStep].title}
          </h2>
          <p style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: '#666',
            margin: 0
          }}>
            {steps[currentStep].content}
          </p>
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center'
        }}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: currentStep === 0 ? 'none' : '2px solid #0060A9',
              background: currentStep === 0 ? '#f0f0f0' : 'white',
              color: currentStep === 0 ? '#999' : '#0060A9',
              fontSize: 16,
              fontWeight: 600,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#0060A9',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {currentStep === steps.length - 1 ? 'Start Playing' : 'Next'}
          </button>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};