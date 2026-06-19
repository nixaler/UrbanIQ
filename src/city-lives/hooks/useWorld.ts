import { useCallback, useEffect, useReducer } from 'react';
import type {
  Citizen, CityEvent, Decision, Family, Playthrough,
  Ripple, WestsideFilesState, World,
} from '../types';
import * as worldApi from '../api/worldApi';
import { FAMILIES, CITIZENS } from '../data/families';

// ── STATE ─────────────────────────────────────────────────────────────────────

interface WorldState {
  world: World | null;
  citizens: Citizen[];
  families: Family[];
  currentPlaythrough: Playthrough | null;
  activeCitizen: Citizen | null;
  activeDecisions: Decision[];
  pendingDecision: Decision | null;
  pendingRippleReveal: Ripple | null;
  revealedRipples: Ripple[];
  sealedRipplesByCitizen: Record<string, Ripple[]>;
  cityEvents: CityEvent[];
  westsideFiles: WestsideFilesState | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_WORLD'; world: World; citizens: Citizen[]; families: Family[] }
  | { type: 'SET_PLAYTHROUGH'; playthrough: Playthrough; citizen: Citizen; decisions: Decision[]; sealedCount: number }
  | { type: 'DECISION_MADE'; decision: Decision; updatedCitizen: Citizen; newRipples: Ripple[]; rippleReveal: Ripple | null }
  | { type: 'RIPPLE_DISMISSED' }
  | { type: 'SET_WESTSIDE_FILES'; state: WestsideFilesState }
  | { type: 'COMPLETE_PLAYTHROUGH'; legacyNote: string; newPlayable: Citizen[] }
  | { type: 'ADVANCE_YEAR' };

const initial: WorldState = {
  world: null,
  citizens: [],
  families: FAMILIES,
  currentPlaythrough: null,
  activeCitizen: null,
  activeDecisions: [],
  pendingDecision: null,
  pendingRippleReveal: null,
  revealedRipples: [],
  sealedRipplesByCitizen: {},
  cityEvents: [],
  westsideFiles: null,
  isLoading: false,
  error: null,
};

function reducer(state: WorldState, action: Action): WorldState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };

    case 'SET_WORLD':
      return {
        ...state,
        world: action.world,
        citizens: action.citizens,
        families: action.families,
        isLoading: false,
        error: null,
      };

    case 'SET_PLAYTHROUGH': {
      const nextDecision = action.decisions[0] ?? null;
      return {
        ...state,
        currentPlaythrough: action.playthrough,
        activeCitizen: action.citizen,
        activeDecisions: action.decisions,
        pendingDecision: nextDecision,
        isLoading: false,
        error: null,
      };
    }

    case 'DECISION_MADE': {
      const updatedDecisions = state.activeDecisions.map(d =>
        d.id === action.decision.id ? action.decision : d
      );
      const nextDecision = updatedDecisions.find(d => !d.chosenOptionId) ?? null;
      return {
        ...state,
        activeCitizen: action.updatedCitizen,
        activeDecisions: updatedDecisions,
        pendingDecision: nextDecision,
        pendingRippleReveal: action.rippleReveal,
        isLoading: false,
      };
    }

    case 'RIPPLE_DISMISSED':
      return {
        ...state,
        pendingRippleReveal: null,
      };

    case 'SET_WESTSIDE_FILES':
      return { ...state, westsideFiles: action.state };

    case 'COMPLETE_PLAYTHROUGH': {
      const updatedCitizens = state.citizens.map(c => {
        const updated = action.newPlayable.find(p => p.id === c.id);
        return updated ?? c;
      });
      if (state.activeCitizen) {
        const legacyCitizen = { ...state.activeCitizen };
        Object.assign(legacyCitizen, { playthroughId: state.currentPlaythrough?.id ?? null });
      }
      return {
        ...state,
        citizens: updatedCitizens,
        currentPlaythrough: null,
        activeCitizen: null,
        activeDecisions: [],
        pendingDecision: null,
        isLoading: false,
      };
    }

    case 'ADVANCE_YEAR': {
      if (!state.currentPlaythrough) return state;
      const nextYear = state.currentPlaythrough.currentYear + 1;
      return {
        ...state,
        currentPlaythrough: { ...state.currentPlaythrough, currentYear: nextYear },
      };
    }

    default:
      return state;
  }
}

// ── HOOK ──────────────────────────────────────────────────────────────────────

export function useWorld(worldId: string | null) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Load world on mount / worldId change
  useEffect(() => {
    if (!worldId) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    worldApi.getWorld(worldId)
      .then(res => {
        dispatch({ type: 'SET_WORLD', world: res.world, citizens: res.citizens, families: res.families });
        return worldApi.getWestsideFiles(worldId);
      })
      .then(wf => dispatch({ type: 'SET_WESTSIDE_FILES', state: wf }))
      .catch(err => dispatch({ type: 'SET_ERROR', error: err.message }));
  }, [worldId]);

  const createWorld = useCallback(async (name: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await worldApi.createWorld(name);
      dispatch({ type: 'SET_WORLD', world: res.world, citizens: res.citizens, families: res.families });
      return res.world;
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
      throw err;
    }
  }, []);

  const startPlaythrough = useCallback(async (citizenId: string) => {
    if (!state.world) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await worldApi.startPlaythrough(state.world.id, citizenId);
      dispatch({
        type: 'SET_PLAYTHROUGH',
        playthrough: res.playthrough,
        citizen: res.citizen,
        decisions: res.firstDecisions,
        sealedCount: res.incomingRipples,
      });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  }, [state.world]);

  const makeDecision = useCallback(async (decisionId: string, optionId: string) => {
    if (!state.currentPlaythrough) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await worldApi.makeDecision(decisionId, optionId, state.currentPlaythrough.id);
      dispatch({
        type: 'DECISION_MADE',
        decision: res.decision,
        updatedCitizen: res.updatedCitizen,
        newRipples: [],
        rippleReveal: res.revealedRipple,
      });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  }, [state.currentPlaythrough]);

  const dismissRipple = useCallback(() => {
    dispatch({ type: 'RIPPLE_DISMISSED' });
  }, []);

  const advanceYear = useCallback(() => {
    dispatch({ type: 'ADVANCE_YEAR' });
  }, []);

  const completePlaythrough = useCallback(async () => {
    if (!state.currentPlaythrough) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await worldApi.completePlaythrough(state.currentPlaythrough.id);
      dispatch({
        type: 'COMPLETE_PLAYTHROUGH',
        legacyNote: res.legacyNote,
        newPlayable: res.newPlayableCharacters,
      });
      return res.legacyNote;
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  }, [state.currentPlaythrough]);

  // Build sealed ripples map from citizens (populated by server)
  const sealedRipplesByCitizen: Record<string, Ripple[]> = {};

  return {
    ...state,
    sealedRipplesByCitizen,
    createWorld,
    startPlaythrough,
    makeDecision,
    dismissRipple,
    advanceYear,
    completePlaythrough,
  };
}
