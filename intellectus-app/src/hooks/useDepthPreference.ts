import { create } from 'zustand';

export type DepthLevel = 'summary' | 'standard' | 'deep';

interface DepthState {
  currentDepth: DepthLevel;
  setDepth: (depth: DepthLevel) => void;
}

// Liquid Depth Toggle (#12) preference — client-only, swaps which
// content_blocks rows render without a network refetch since the parent
// Server Component already fetched all three depths up front.
export const useDepthPreference = create<DepthState>((set) => ({
  currentDepth: 'standard',
  setDepth: (depth) => set({ currentDepth: depth }),
}));
