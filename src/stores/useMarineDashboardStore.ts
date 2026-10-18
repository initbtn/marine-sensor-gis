import { create } from 'zustand';
import {
  VesselInfo,
  AlarmEvent,
  UserRole,
} from '../types/telemetry';
import { INITIAL_VESSELS } from '../services/mockTelemetry';
import { OperatingMode, NetworkStatus, SyncState } from '../components/Dashboard/ModeToggleBar';
import { dualDbSyncEngine } from '../services/dualDbSyncEngine';

export interface MarineDashboardState {
  currentRole: UserRole;
  operatingMode: OperatingMode;
  networkStatus: NetworkStatus;
  syncStatus: SyncState;
  pendingCount: number;
  selectedVesselId: string;
  facilityTab: 'SCRUBBER' | 'BWTS';
  isStreaming: boolean;
  vessels: VesselInfo[];
  alarms: AlarmEvent[];

  // Actions
  setRole: (role: UserRole) => void;
  setOperatingMode: (mode: OperatingMode) => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setSyncStatus: (status: SyncState) => void;
  setPendingCount: (count: number) => void;
  setSelectedVesselId: (id: string) => void;
  setFacilityTab: (tab: 'SCRUBBER' | 'BWTS') => void;
  setIsStreaming: (streaming: boolean) => void;
  setVessels: (vessels: VesselInfo[]) => void;
  setAlarms: (alarms: AlarmEvent[]) => void;
  acknowledgeAlarm: (alarmId: string) => void;
  reset: () => void;
}

const initialState = {
  currentRole: 'CHIEF_ENGINEER' as UserRole,
  operatingMode: 'EDGE' as OperatingMode,
  networkStatus: 'ONLINE' as NetworkStatus,
  syncStatus: 'IDLE' as SyncState,
  pendingCount: 0,
  selectedVesselId: 'VSL-001',
  facilityTab: 'SCRUBBER' as 'SCRUBBER' | 'BWTS',
  isStreaming: true,
  vessels: INITIAL_VESSELS,
  alarms: [] as AlarmEvent[],
};

export const useMarineDashboardStore = create<MarineDashboardState>((set) => ({
  ...initialState,

  setRole: (role) => set({ currentRole: role }),
  setOperatingMode: (mode) => set({ operatingMode: mode }),
  setNetworkStatus: (status) => set({ networkStatus: status }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setSelectedVesselId: (id) => set({ selectedVesselId: id }),
  setFacilityTab: (tab) => set({ facilityTab: tab }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setVessels: (vessels) => set({ vessels }),
  setAlarms: (alarms) => set({ alarms }),
  acknowledgeAlarm: (alarmId) =>
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, acknowledged: true } : alarm
      ),
    })),
  reset: () =>
    set({
      ...initialState,
      pendingCount: dualDbSyncEngine.getQueueLength(),
    }),
}));
