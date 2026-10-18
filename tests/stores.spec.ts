import { describe, it, expect, beforeEach } from 'vitest';
import { useMarineDashboardStore } from '../src/stores/useMarineDashboardStore';
import { useTelemetryStore } from '../src/stores/useTelemetryStore';

describe('Zustand Stores TDD (Marine Dashboard & Telemetry)', () => {
  beforeEach(() => {
    useMarineDashboardStore.getState().reset();
    useTelemetryStore.getState().reset();
  });

  describe('useMarineDashboardStore', () => {
    it('초기 기본 상태가 올바르게 설정되어야 한다', () => {
      const state = useMarineDashboardStore.getState();
      expect(state.currentRole).toBe('CHIEF_ENGINEER');
      expect(state.operatingMode).toBe('EDGE');
      expect(state.networkStatus).toBe('ONLINE');
      expect(state.selectedVesselId).toBe('VSL-001');
      expect(state.facilityTab).toBe('SCRUBBER');
      expect(state.isStreaming).toBe(true);
    });

    it('직무 전환(setRole) 액션이 상태를 업데이트해야 한다 (OCP/ISP)', () => {
      useMarineDashboardStore.getState().setRole('COMPLIANCE_OFFICER');
      expect(useMarineDashboardStore.getState().currentRole).toBe('COMPLIANCE_OFFICER');

      useMarineDashboardStore.getState().setRole('DIAGNOSTIC_TECH');
      expect(useMarineDashboardStore.getState().currentRole).toBe('DIAGNOSTIC_TECH');
    });

    it('운영 모드 및 네트워크 상태 전환 액션이 동작해야 한다', () => {
      useMarineDashboardStore.getState().setOperatingMode('CLOUD');
      expect(useMarineDashboardStore.getState().operatingMode).toBe('CLOUD');

      useMarineDashboardStore.getState().setNetworkStatus('OFFLINE');
      expect(useMarineDashboardStore.getState().networkStatus).toBe('OFFLINE');
    });

    it('알람 인지(acknowledgeAlarm) 액션이 특정 알람 상태를 갱신해야 한다', () => {
      const mockAlarm = {
        id: 'ALM-001',
        vesselId: 'VSL-001',
        vesselName: 'Pan Pioneer',
        facilityType: 'SCRUBBER' as const,
        level: 'CRITICAL' as const,
        code: 'SOX_EXCEEDED',
        message: 'SOx 한계치 초과',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };

      useMarineDashboardStore.getState().setAlarms([mockAlarm]);
      expect(useMarineDashboardStore.getState().alarms[0].acknowledged).toBe(false);

      useMarineDashboardStore.getState().acknowledgeAlarm('ALM-001');
      expect(useMarineDashboardStore.getState().alarms[0].acknowledged).toBe(true);
    });
  });

  describe('useTelemetryStore', () => {
    it('텔레메트리 업데이트 및 히스토리 누적이 정상 동작해야 한다 (10Hz Buffer)', () => {
      const mockScrubber = {
        timestamp: new Date().toISOString(),
        co2Percent: 4.5,
        soxPpm: 18.2,
        so2Co2Ratio: 4.04,
        phInlet: 8.1,
        phDischarge: 6.8,
        turbidityFtu: 12.0,
        pahPpb: 25.0,
        washwaterFlowM3h: 1200,
        pressureDropKpa: 1.2,
      };

      useTelemetryStore.getState().setCurrentScrubber(mockScrubber);
      expect(useTelemetryStore.getState().currentScrubber.soxPpm).toBe(18.2);
      expect(useTelemetryStore.getState().scrubberHistory.length).toBeGreaterThan(0);
    });

    it('비상 바이패스 밸브 상태 토글이 동작해야 한다', () => {
      expect(useTelemetryStore.getState().bypassValveOpen).toBe(false);
      useTelemetryStore.getState().setBypassValveOpen(true);
      expect(useTelemetryStore.getState().bypassValveOpen).toBe(true);
    });
  });
});
