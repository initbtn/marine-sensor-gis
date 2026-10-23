import { create } from 'zustand';
import {
  VesselInfo,
  AlarmEvent,
  UserRole,
  Position,
} from '../types/telemetry';
import { MaritimeUser } from '../types/auth';
import {
  INITIAL_VESSELS,
  DEFAULT_VESSEL_TRACKS,
  calculateDeadReckoningPosition,
} from '../services/mockTelemetry';
import { OperatingMode, NetworkStatus, SyncState } from '../components/Dashboard/ModeToggleBar';
import { dualDbSyncEngine } from '../services/dualDbSyncEngine';
import { maritimeAuthService } from '../services/maritimeAuthService';
import { accessAuditService } from '../services/accessAuditService';

export interface MarineDashboardState {
  currentUser: MaritimeUser;
  currentRole: UserRole;
  operatingMode: OperatingMode;
  networkStatus: NetworkStatus;
  syncStatus: SyncState;
  pendingCount: number;
  selectedVesselId: string;
  facilityTab: 'SCRUBBER' | 'BWTS';
  isStreaming: boolean;
  vessels: VesselInfo[];
  trackHistories: Record<string, Position[]>;
  alarms: AlarmEvent[];

  // Actions
  setCurrentUser: (user: MaritimeUser) => void;
  loginWithPreset: (presetId: string) => Promise<MaritimeUser>;
  logout: () => Promise<MaritimeUser>;
  setRole: (role: UserRole) => void;
  setOperatingMode: (mode: OperatingMode) => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setSyncStatus: (status: SyncState) => void;
  setPendingCount: (count: number) => void;
  setSelectedVesselId: (id: string) => void;
  setFacilityTab: (tab: 'SCRUBBER' | 'BWTS') => void;
  setIsStreaming: (streaming: boolean) => void;
  setVessels: (vessels: VesselInfo[]) => void;
  setTrackHistories: (histories: Record<string, Position[]>) => void;
  advanceVesselPositions: (deltaSeconds?: number) => void;
  setAlarms: (alarms: AlarmEvent[]) => void;
  acknowledgeAlarm: (alarmId: string) => void;
  reset: () => void;
}

const initialUser = maritimeAuthService.getCurrentUser();

const initialState = {
  currentUser: initialUser,
  currentRole: initialUser.role || ('CHIEF_ENGINEER' as UserRole),
  operatingMode: 'EDGE' as OperatingMode,
  networkStatus: 'ONLINE' as NetworkStatus,
  syncStatus: 'IDLE' as SyncState,
  pendingCount: 0,
  selectedVesselId: 'VSL-001',
  facilityTab: 'SCRUBBER' as 'SCRUBBER' | 'BWTS',
  isStreaming: true,
  vessels: INITIAL_VESSELS,
  trackHistories: JSON.parse(JSON.stringify(DEFAULT_VESSEL_TRACKS)) as Record<string, Position[]>,
  alarms: [] as AlarmEvent[],
};

export const useMarineDashboardStore = create<MarineDashboardState>((set, get) => ({
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user, currentRole: user.role });
  },

  loginWithPreset: async (presetId) => {
    const user = await maritimeAuthService.loginWithPreset(presetId);
    set({ currentUser: user, currentRole: user.role });
    await accessAuditService.logAuditEvent({
      actionType: 'SESSION_START',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
      userHashId: user.userHashId,
      assignedRole: user.role,
      organization: user.organization,
    });
    return user;
  },

  logout: async () => {
    const prevUser = get().currentUser;
    await accessAuditService.logAuditEvent({
      actionType: 'SESSION_END',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
      userHashId: prevUser.userHashId,
      assignedRole: prevUser.role,
      organization: prevUser.organization,
    });
    const guest = await maritimeAuthService.logout();
    set({ currentUser: guest, currentRole: guest.role });
    return guest;
  },

  setRole: (role) => {
    const current = get().currentUser;
    const updatedUser: MaritimeUser = {
      ...current,
      role,
    };
    set({ currentRole: role, currentUser: updatedUser });
    accessAuditService.logAuditEvent({
      actionType: 'ROLE_SWITCH',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
      userHashId: updatedUser.userHashId,
      assignedRole: role,
      organization: updatedUser.organization,
    }).catch(() => {});
  },

  setOperatingMode: (mode) => {
    set({ operatingMode: mode });
    accessAuditService.logAuditEvent({
      actionType: 'MODE_TOGGLE',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    }).catch(() => {});
  },

  setNetworkStatus: (status) => set({ networkStatus: status }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setSelectedVesselId: (id) => {
    set({ selectedVesselId: id });
    accessAuditService.logAuditEvent({
      actionType: 'VESSEL_SELECT',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    }).catch(() => {});
  },
  setFacilityTab: (tab) => set({ facilityTab: tab }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setVessels: (vessels) => set({ vessels }),
  setTrackHistories: (histories) => set({ trackHistories: histories }),
  advanceVesselPositions: (deltaSeconds = 5) => {
    set((state) => {
      const nextVessels = state.vessels.map((v) => {
        const result = calculateDeadReckoningPosition(v, deltaSeconds);
        return {
          ...v,
          position: result.position,
          headingDeg: result.headingDeg,
        };
      });

      const nextTrackHistories = { ...state.trackHistories };
      for (const v of nextVessels) {
        const history = nextTrackHistories[v.id] ? [...nextTrackHistories[v.id]] : [];
        history.push(v.position);
        nextTrackHistories[v.id] = history.slice(-50);
      }

      return {
        vessels: nextVessels,
        trackHistories: nextTrackHistories,
      };
    });
  },
  setAlarms: (alarms) => set({ alarms }),
  acknowledgeAlarm: (alarmId) => {
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, acknowledged: true } : alarm
      ),
    }));
    accessAuditService.logAuditEvent({
      actionType: 'ALARM_ACK',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    }).catch(() => {});
  },
  reset: () =>
    set({
      ...initialState,
      trackHistories: JSON.parse(JSON.stringify(DEFAULT_VESSEL_TRACKS)) as Record<string, Position[]>,
      currentUser: maritimeAuthService.getCurrentUser(),
      pendingCount: dualDbSyncEngine.getQueueLength(),
    }),
}));

