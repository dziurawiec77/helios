import { create } from "zustand";
import type { BodyId } from "./bodies";

type SolarState = {
  paused: boolean;
  speed: number;
  selectedId: BodyId | null;
  showOrbits: boolean;
  showLabels: boolean;
  viewNonce: number;
  togglePaused: () => void;
  setSpeed: (speed: number) => void;
  select: (id: BodyId | null) => void;
  setShowOrbits: (value: boolean) => void;
  setShowLabels: (value: boolean) => void;
  resetView: () => void;
};

export const useSolarStore = create<SolarState>((set) => ({
  paused: false,
  speed: 1,
  selectedId: "earth",
  showOrbits: true,
  showLabels: false,
  viewNonce: 0,
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  select: (selectedId) => set({ selectedId }),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setShowLabels: (showLabels) => set({ showLabels }),
  resetView: () =>
    set((s) => ({ selectedId: null, viewNonce: s.viewNonce + 1 })),
}));
