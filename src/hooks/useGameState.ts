import { useState, useEffect, useCallback } from 'react';
import { GameState, GameMode } from '../types';

interface UseGameStateReturn {
  gameState: GameState;
  startGame: (mode: GameMode) => void;
  makeGuess: (guess: string) => boolean;
  resetGame: () => void;
  addHint: (hint: string) => void;
}

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>({
    currentMode: 'dc',
    score: 0,
    round: 1,
    maxRounds: 3,
    guesses: [],
    targetAnswer: '',
    hints: [],
    isComplete: false,
    startTime: Date.now()
  });

  const startGame = useCallback((mode: GameMode) => {
    setGameState({
      currentMode: mode,
      score: 0,
      round: 1,
      maxRounds: 3,
      guesses: [],
      targetAnswer: '',
      hints: [],
      isComplete: false,
      startTime: Date.now()
    });
  }, []);

  const makeGuess = useCallback((guess: string): boolean => {
    setGameState(prev => {
      if (prev.isComplete) return prev;
      
      const isCorrect = guess.toLowerCase() === prev.targetAnswer.toLowerCase();
      const newGuesses = [...prev.guesses, guess];
      
      if (isCorrect) {
        return {
          ...prev,
          guesses: newGuesses,
          score: prev.score + (prev.maxRounds - newGuesses.length + 1) * 100,
          isComplete: true
        };
      }
      
      // Check if max guesses reached
      if (newGuesses.length >= 6) {
        return {
          ...prev,
          guesses: newGuesses,
          isComplete: true
        };
      }
      
      return {
        ...prev,
        guesses: newGuesses
      };
    });
    
    return guess.toLowerCase() === gameState.targetAnswer.toLowerCase();
  }, [gameState.targetAnswer]);

  const resetGame = useCallback(() => {
    setGameState({
      currentMode: 'dc',
      score: 0,
      round: 1,
      maxRounds: 3,
      guesses: [],
      targetAnswer: '',
      hints: [],
      isComplete: false,
      startTime: Date.now()
    });
  }, []);

  const addHint = useCallback((hint: string) => {
    setGameState(prev => ({
      ...prev,
      hints: [...prev.hints, hint]
    }));
  }, []);

  return {
    gameState,
    startGame,
    makeGuess,
    resetGame,
    addHint
  };
}