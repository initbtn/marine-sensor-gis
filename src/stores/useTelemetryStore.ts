import { create } from 'zustand';
import {
  ScrubberTelemetry,
  BWTSTelemetry,
} from '../types/telemetry';
import {
  generateScrubberTelemetry,
  generateBWTSTelemetry,
} from '../services/mockTelemetry';
import { EdgeTelemetryResponse } from '../services/edgeControlClient';

export interface TelemetryHistoryItem {
  timestamp: string;
  scrubber: ScrubberTelemetry;
  bwts: BWTSTelemetry;
}

export interface TelemetryStoreState {
  currentScrubber: ScrubberTelemetry;
  currentBWTS: BWTSTelemetry;
  history: TelemetryHistoryItem[];
  scrubberHistory: ScrubberTelemetry[];
  bwtsHistory: BWTSTelemetry[];
  edgeTelemetry: EdgeTelemetryResponse | null;
  bypassValveOpen: boolean;
  backwashActive: boolean;

  // Actions
  setCurrentScrubber: (data: ScrubberTelemetry) => void;
  setCurrentBWTS: (data: BWTSTelemetry) => void;
  addHistoryItem: (item: TelemetryHistoryItem) => void;
  setEdgeTelemetry: (data: EdgeTelemetryResponse | null) => void;
  setBypassValveOpen: (open: boolean) => void;
  setBackwashActive: (active: boolean) => void;
  reset: () => void;
}

const initialScrubber = generateScrubberTelemetry();
const initialBWTS = generateBWTSTelemetry();
const initialHistory: TelemetryHistoryItem = {
  timestamp: new Date().toISOString(),
  scrubber: initialScrubber,
  bwts: initialBWTS,
};

export const useTelemetryStore = create<TelemetryStoreState>((set) => ({
  currentScrubber: initialScrubber,
  currentBWTS: initialBWTS,
  history: [initialHistory],
  scrubberHistory: [initialScrubber],
  bwtsHistory: [initialBWTS],
  edgeTelemetry: null,
  bypassValveOpen: false,
  backwashActive: false,

  setCurrentScrubber: (data) =>
    set((state) => ({
      currentScrubber: data,
      scrubberHistory: [...state.scrubberHistory.slice(-29), data],
    })),

  setCurrentBWTS: (data) =>
    set((state) => ({
      currentBWTS: data,
      bwtsHistory: [...state.bwtsHistory.slice(-29), data],
    })),

  addHistoryItem: (item) =>
    set((state) => ({
      history: [...state.history.slice(-29), item],
    })),

  setEdgeTelemetry: (data) => set({ edgeTelemetry: data }),
  setBypassValveOpen: (open) => set({ bypassValveOpen: open }),
  setBackwashActive: (active) => set({ backwashActive: active }),

  reset: () =>
    set({
      currentScrubber: generateScrubberTelemetry(),
      currentBWTS: generateBWTSTelemetry(),
      history: [],
      scrubberHistory: [],
      bwtsHistory: [],
      edgeTelemetry: null,
      bypassValveOpen: false,
      backwashActive: false,
    }),
}));
