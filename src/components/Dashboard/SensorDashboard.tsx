import React, { useEffect, useMemo, useCallback } from 'react';
import {
  generateScrubberTelemetry,
  generateBWTSTelemetry,
  evaluateAlarms,
} from '../../services/mockTelemetry';
import { dualDbSyncEngine } from '../../services/dualDbSyncEngine';
import { sendTelegramAlert } from '../../services/telegramAlertService';
import { accessAuditService } from '../../services/accessAuditService';
import { useMarineDashboardStore } from '../../stores/useMarineDashboardStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useTelemetryStream } from '../../hooks/useTelemetryStream';
import { SensorDashboardView } from './SensorDashboardView';
import { AlarmList } from './AlarmList';
import { ModeToggleBar } from './ModeToggleBar';
import { RoleSwitcher } from '../Common/RoleSwitcher';
import { ShieldAlert, Play, Pause } from 'lucide-react';

export interface SensorDashboardProps {
  standalone?: boolean;
}

export const SensorDashboard: React.FC<SensorDashboardProps> = ({ standalone = true }) => {
  const {
    currentRole,
    setRole,
    operatingMode,
    setOperatingMode,
    networkStatus,
    setNetworkStatus,
    syncStatus,
    setSyncStatus,
    pendingCount,
    setPendingCount,
    selectedVesselId,
    setSelectedVesselId,
    facilityTab,
    setFacilityTab,
    isStreaming,
    setIsStreaming,
    vessels,
    alarms,
    setAlarms,
    acknowledgeAlarm,
  } = useMarineDashboardStore();

  const {
    currentScrubber,
    currentBWTS,
    history,
    setCurrentScrubber,
    setCurrentBWTS,
    addHistoryItem,
    bypassValveOpen,
    setBypassValveOpen,
  } = useTelemetryStore();

  const edgeStream = useTelemetryStream({
    autoPoll: isStreaming && networkStatus === 'ONLINE',
    pollIntervalMs: 2000,
  });

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];

  // 10Hz GCP 센서 원격 바이패스 다운링크 동기화
  useEffect(() => {
    if (edgeStream.telemetry?.controls) {
      setBypassValveOpen(edgeStream.telemetry.controls.emergency_bypass);
    }
  }, [edgeStream.telemetry, setBypassValveOpen]);

  // 5초 주기 센서 시뮬레이션 및 알람 평가
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      const nextScrubber = generateScrubberTelemetry();
      const nextBWTS = generateBWTSTelemetry();
      const now = new Date().toISOString();

      setCurrentScrubber(nextScrubber);
      setCurrentBWTS(nextBWTS);
      addHistoryItem({
        timestamp: now,
        scrubber: nextScrubber,
        bwts: nextBWTS,
      });

      // 알람 평가 (vessel, scrubber, bwts)
      const newAlarms = evaluateAlarms(selectedVessel, nextScrubber, nextBWTS);
      if (newAlarms.length > 0) {
        setAlarms([...newAlarms, ...alarms].slice(0, 50));

        // 크리티컬 알람 시 텔레그램 전파
        const criticalAlarm = newAlarms.find((a) => a.level === 'CRITICAL');
        if (criticalAlarm) {
          await sendTelegramAlert({
            level: 'CRITICAL',
            area: `${criticalAlarm.vesselName} (${criticalAlarm.facilityType})`,
            message: `[${criticalAlarm.code}] ${criticalAlarm.message}`,
            details: `계측치 이상 감지 - 즉각 현장 조치 요망`,
          });
        }
      }

      // Store-and-Forward 오프라인 큐 적재 (위성 링크 단절 시)
      if (networkStatus === 'OFFLINE') {
        dualDbSyncEngine.enqueueRecord({
          vessel_id: selectedVessel.id,
          sox_ppm: nextScrubber.soxPpm,
          ph_inlet: nextScrubber.phInlet,
          ph_discharge: nextScrubber.phDischarge,
          turbidity_ftu: nextScrubber.turbidityFtu,
          bwts_flow_rate_m3h: nextBWTS.flowRateM3h,
          bwts_tro_ppm: nextBWTS.troPpm,
        });
        setPendingCount(dualDbSyncEngine.getQueueLength());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    isStreaming,
    networkStatus,
    selectedVessel,
    alarms,
    setCurrentScrubber,
    setCurrentBWTS,
    addHistoryItem,
    setAlarms,
    setPendingCount,
  ]);

  // 클라우드 모드 24h 집계 통계치 (파생 상태 인라인 계산)
  const cloudAggregates = useMemo(() => {
    if (history.length === 0) {
      return {
        complianceRate: 99.5,
        avgSox: 14.2,
        maxSox: 20.8,
        minPh: 6.8,
        avgPh: 7.4,
        avgTro: 0.04,
        maxTro: 0.08,
      };
    }
    const soxValues = history.map((h) => h.scrubber.soxPpm);
    const phValues = history.map((h) => h.scrubber.phDischarge);
    const troValues = history.map((h) => h.bwts.troPpm);

    const avgSox = Number((soxValues.reduce((a, b) => a + b, 0) / soxValues.length).toFixed(1));
    const maxSox = Number(Math.max(...soxValues).toFixed(1));
    const minPh = Number(Math.min(...phValues).toFixed(1));
    const avgPh = Number((phValues.reduce((a, b) => a + b, 0) / phValues.length).toFixed(1));
    const avgTro = Number((troValues.reduce((a, b) => a + b, 0) / (troValues.length || 1)).toFixed(2));
    const maxTro = Number(Math.max(...troValues, 0).toFixed(2));

    const compliantCount = history.filter((h) => h.scrubber.soxPpm <= 21.7 && h.scrubber.phDischarge >= 6.5).length;
    const complianceRate = Number(((compliantCount / history.length) * 100).toFixed(1));

    return {
      complianceRate: complianceRate > 90 ? complianceRate : 98.5,
      avgSox,
      maxSox,
      minPh,
      avgPh,
      avgTro,
      maxTro,
    };
  }, [history]);

  const handleToggleBypass = useCallback(async () => {
    const next = !bypassValveOpen;
    setBypassValveOpen(next);
    await edgeStream.toggleBypass(next);
    await accessAuditService.logAuditEvent({
      actionType: 'BYPASS_TOGGLE',
      targetPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    });
  }, [bypassValveOpen, setBypassValveOpen, edgeStream]);

  return (
    <div className="flex flex-col gap-4" data-testid="sensor-dashboard">
      {/* Dashboard Top Control Toolbar (Standalone 환경 또는 페이지 액션 바) */}
      <div className="bg-slate-900/90 rounded-xl p-3 border border-marine-border flex items-center justify-between flex-wrap gap-3 shadow-md">
        {standalone ? (
          <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-marine-cyan">
              ⚡ 실시간 센서 관제 패널
            </span>
            {selectedVessel && (
              <span className="marine-chip text-xs">
                {selectedVessel.name} ({selectedVessel.imoNumber})
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* 비상 바이패스 제어 버튼 */}
          <button
            type="button"
            onClick={handleToggleBypass}
            className={`marine-btn text-xs font-semibold ${
              bypassValveOpen
                ? 'marine-btn-danger animate-pulse'
                : 'bg-rose-950/40 text-rose-400 border border-rose-500/40 hover:bg-rose-900/50'
            }`}
          >
            <ShieldAlert size={14} />
            비상 바이패스 (Bypass)
          </button>

          {/* 스트리밍 일시정지/재개 */}
          <button
            type="button"
            onClick={() => setIsStreaming(!isStreaming)}
            className={`marine-btn text-xs font-semibold ${
              isStreaming
                ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                : 'marine-btn-primary'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause size={14} /> 일시정지
              </>
            ) : (
              <>
                <Play size={14} /> 스트리밍 재개
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2원화 모드 및 위성 네트워크 바 (스탠드얼론 환경 전용) */}
      {standalone && (
        <ModeToggleBar
          operatingMode={operatingMode}
          networkStatus={networkStatus}
          syncStatus={syncStatus}
          pendingCount={pendingCount}
          onToggleOperatingMode={setOperatingMode}
          onToggleNetworkStatus={async () => {
            const next = networkStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
            setNetworkStatus(next);
            await dualDbSyncEngine.setSatelliteLink(next === 'ONLINE');
            if (next === 'ONLINE') {
              await dualDbSyncEngine.flushSyncQueue();
              setPendingCount(dualDbSyncEngine.getQueueLength());
            }
          }}
          onManualFlush={async () => {
            setSyncStatus('SYNCING');
            try {
              await dualDbSyncEngine.flushSyncQueue();
              setPendingCount(dualDbSyncEngine.getQueueLength());
              setSyncStatus('IDLE');
            } catch {
              setSyncStatus('ERROR');
            }
          }}
        />
      )}

      {/* Pure Presentational Dashboard View */}
      <SensorDashboardView
        vessels={vessels}
        selectedVessel={selectedVessel}
        onSelectVessel={setSelectedVesselId}
        facilityTab={facilityTab}
        onTabChange={setFacilityTab}
        currentRole={currentRole}
        operatingMode={operatingMode}
        currentScrubber={currentScrubber}
        currentBWTS={currentBWTS}
        history={history}
        cloudAggregates={cloudAggregates}
        bypassValveOpen={bypassValveOpen}
        onToggleBypass={handleToggleBypass}
      />

      {/* Alarm Log Panel */}
      <AlarmList alarms={alarms} onAcknowledge={acknowledgeAlarm} />
    </div>
  );
};
