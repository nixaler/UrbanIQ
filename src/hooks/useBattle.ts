import { useState, useCallback } from 'react';
import { BattleRecord, Card, LeaderboardEntry, BattleHistory, BattleSubmitResponse } from '../types';

interface UseBattleReturn {
  battleRecord: BattleRecord | null;
  isSubmitting: boolean;
  submitDeck: (playerId: string, playerName: string, deck: Card[]) => Promise<BattleSubmitResponse>;
  getBattleStatus: (battleId: string) => Promise<BattleRecord | null>;
  getBattleHistory: (playerId: string) => Promise<BattleHistory[]>;
  getLeaderboard: () => Promise<LeaderboardEntry[]>;
  clearBattle: () => void;
}

export function useBattle(): UseBattleReturn {
  const [battleRecord, setBattleRecord] = useState<BattleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDeck = useCallback(async (
    playerId: string,
    playerName: string,
    deck: Card[]
  ): Promise<BattleSubmitResponse> => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/battle/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, deck })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit deck');
      }
      
      const data = await response.json();
      
      if (data.record) {
        setBattleRecord(data.record);
      }
      
      return data;
    } catch (error) {
      console.error('Error submitting deck:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const getBattleStatus = useCallback(async (battleId: string): Promise<BattleRecord | null> => {
    try {
      const response = await fetch(`/api/battle/status/${battleId}`);
      if (!response.ok) {
        throw new Error('Failed to get battle status');
      }
      const data = await response.json();
      setBattleRecord(data);
      return data;
    } catch (error) {
      console.error('Error getting battle status:', error);
      return null;
    }
  }, []);

  const getBattleHistory = useCallback(async (playerId: string): Promise<BattleHistory[]> => {
    try {
      const response = await fetch(`/api/battle/history/${playerId}`);
      if (!response.ok) {
        throw new Error('Failed to get battle history');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting battle history:', error);
      return [];
    }
  }, []);

  const getLeaderboard = useCallback(async (): Promise<LeaderboardEntry[]> => {
    try {
      const response = await fetch('/api/battle/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to get leaderboard');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }, []);

  const clearBattle = useCallback(() => {
    setBattleRecord(null);
  }, []);

  return {
    battleRecord,
    isSubmitting,
    submitDeck,
    getBattleStatus,
    getBattleHistory,
    getLeaderboard,
    clearBattle
  };
}