import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  VesselInfo,
  ScrubberTelemetry,
  BWTSTelemetry,
  AlarmEvent,
} from '../../types/telemetry';
import {
  INITIAL_VESSELS,
  generateScrubberTelemetry,
  generateBWTSTelemetry,
  evaluateAlarms,
  createRealtimePacket,
} from '../../services/mockTelemetry';
import { dualDbSyncEngine } from '../../services/dualDbSyncEngine';
import { sendTelegramAlert } from '../../services/telegramAlertService';
import { MarineMap } from '../Map/MarineMap';
import { TelemetryChart } from '../Chart/TelemetryChart';
import { SensorCards } from './SensorCards';
import { AlarmList } from './AlarmList';
import {
  ModeToggleBar,
  OperatingMode,
  NetworkStatus,
  SyncState,
} from './ModeToggleBar';

export const SensorDashboard: React.FC = () => {
  const [vessels, setVessels] = useState<VesselInfo[]>(INITIAL_VESSELS);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('VSL-001');
  const [facilityTab, setFacilityTab] = useState<'SCRUBBER' | 'BWTS'>('SCRUBBER');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  // 2원화 관제 모드 및 위성 네트워크 / 동기화 상태
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('EDGE');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('ONLINE');
  const [syncStatus, setSyncStatus] = useState<SyncState>('IDLE');
  const [pendingCount, setPendingCount] = useState<number>(() =>
    dualDbSyncEngine.getQueueLength()
  );

  // 선택된 선박의 텔레메트리 상태 및 이력
  const [currentScrubber, setCurrentScrubber] = useState<ScrubberTelemetry>(() =>
    generateScrubberTelemetry()
  );
  const [currentBWTS, setCurrentBWTS] = useState<BWTSTelemetry>(() =>
    generateBWTSTelemetry()
  );
  const [history, setHistory] = useState<
    Array<{ timestamp: string; scrubber: ScrubberTelemetry; bwts: BWTSTelemetry }>
  >([]);
  const [alarms, setAlarms] = useState<AlarmEvent[]>([]);
  const [trackHistory, setTrackHistory] = useState<Record<string, [number, number][]>>({
    'VSL-001': [
      [35.1, 129.04],
      [34.98, 128.9],
      [34.85, 128.75],
    ],
    'VSL-002': [
      [1.15, 103.65],
      [1.2, 103.75],
      [1.25, 103.85],
    ],
    'VSL-003': [
      [20.95, 121.2],
      [21.05, 121.35],
      [21.15, 121.5],
    ],
  });

  const selectedVessel = useMemo(
    () => vessels.find((v) => v.id === selectedVesselId) || vessels[0],
    [vessels, selectedVesselId]
  );

  // Store-and-Forward 동기화 핸들러
  const handleManualFlush = useCallback(async () => {
    if (networkStatus === 'OFFLINE' || syncStatus === 'SYNCING') return;

    setSyncStatus('SYNCING');
    try {
      await dualDbSyncEngine.flushSyncQueue();
      setPendingCount(dualDbSyncEngine.getQueueLength());
      setSyncStatus('IDLE');
    } catch {
      setSyncStatus('ERROR');
    }
  }, [networkStatus, syncStatus]);

  // 네트워크 상태 토글 핸들러
  const handleToggleNetwork = useCallback(() => {
    setNetworkStatus((prev) => {
      const next = prev === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      if (next === 'ONLINE') {
        // 온라인 복구 시 자동 백그라운드 동기화 트리거
        dualDbSyncEngine.flushSyncQueue().then(() => {
          setPendingCount(dualDbSyncEngine.getQueueLength());
        });
      }
      return next;
    });
  }, []);

  // 실시간 텔레메트리 갱신 루프 (2초 주기)
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // 1. 선박 위치 미세 이동
      setVessels((prevVessels) =>
        prevVessels.map((v) => {
          const packet = createRealtimePacket(v);
          return {
            ...v,
            position: packet.position,
            speedKts: Number((v.speedKts + (Math.random() - 0.5) * 0.4).toFixed(1)),
          };
        })
      );

      // 2. 항적 이력 추가
      setTrackHistory((prev) => {
        const currentTracks = prev[selectedVesselId] || [];
        const lastPos: [number, number] = [
          selectedVessel.position.lat,
          selectedVessel.position.lng,
        ];
        return {
          ...prev,
          [selectedVesselId]: [...currentTracks.slice(-20), lastPos],
        };
      });

      // 3. 센서 데이터 갱신
      const newScrubber = generateScrubberTelemetry();
      const newBWTS = generateBWTSTelemetry();
      setCurrentScrubber(newScrubber);
      setCurrentBWTS(newBWTS);

      // Store-and-Forward 오프라인 큐 적재 (위성 링크 단절 시)
      if (networkStatus === 'OFFLINE') {
        dualDbSyncEngine.enqueueRecord({
          vessel_id: selectedVesselId,
          sox_ppm: newScrubber.soxPpm,
          ph_inlet: newScrubber.phInlet,
          ph_discharge: newScrubber.phDischarge,
          turbidity_ftu: newScrubber.turbidityFtu,
          bwts_flow_rate_m3h: newBWTS.flowRateM3h,
          bwts_tro_ppm: newBWTS.troPpm,
        });
        setPendingCount(dualDbSyncEngine.getQueueLength());
      }

      setHistory((prev) => [
        ...prev.slice(-15),
        {
          timestamp: new Date().toISOString(),
          scrubber: newScrubber,
          bwts: newBWTS,
        },
      ]);

      // 4. 경보 평가
      const newAlarms = evaluateAlarms(selectedVessel, newScrubber, newBWTS);
      if (newAlarms.length > 0) {
        setAlarms((prev) => [...newAlarms, ...prev].slice(0, 30));

        // CRITICAL 경보 발생 시 멀티 프로젝트 텔레그램 공용 웹훅 알림 전송
        const critical = newAlarms.find((a) => a.level === 'CRITICAL');
        if (critical) {
          sendTelegramAlert({
            level: 'CRITICAL',
            area: `${selectedVessel.name} (${critical.facilityType})`,
            message: `${critical.code}: ${critical.message}`,
            details: `선박 위치: ${selectedVessel.position.lat.toFixed(4)}°N, ${selectedVessel.position.lng.toFixed(4)}°E`,
          });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming, selectedVesselId, selectedVessel, networkStatus]);

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, acknowledged: true } : a))
    );
  };

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f8fafc',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '2px solid #334155',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>
            🌊 해양 친환경 설비 실시간 센서 모니터링 &amp; GIS 관제 웹 플랫폼
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            IMO 탈황 규제(MARPOL Annex VI) &amp; 선박평형수(BWTS D-2) 실시간 텔레메트리 관제 시스템
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isStreaming ? '#ef4444' : '#10b981',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {isStreaming ? '⏸ 스트리밍 일시정지' : '▶ 실시간 스트리밍 재개'}
          </button>
        </div>
      </header>

      {/* 2원화 HMI 관제 모드 및 위성 네트워크 / 동기화 바 */}
      <ModeToggleBar
        operatingMode={operatingMode}
        networkStatus={networkStatus}
        syncStatus={syncStatus}
        pendingCount={pendingCount}
        onToggleOperatingMode={setOperatingMode}
        onToggleNetworkStatus={handleToggleNetwork}
        onManualFlush={handleManualFlush}
      />

      {/* Vessel Selector Strip */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {vessels.map((vessel) => {
          const isSelected = vessel.id === selectedVesselId;
          return (
            <div
              key={vessel.id}
              onClick={() => setSelectedVesselId(vessel.id)}
              style={{
                flex: '1 0 280px',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: isSelected ? '2px solid #0284c7' : '1px solid #334155',
                background: isSelected ? '#1e293b' : '#0f172a',
                boxShadow: isSelected ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{vessel.name}</strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      vessel.status === 'CRITICAL'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : vessel.status === 'WARNING'
                        ? 'rgba(234, 179, 8, 0.2)'
                        : 'rgba(34, 197, 94, 0.2)',
                    color:
                      vessel.status === 'CRITICAL'
                        ? '#f87171'
                        : vessel.status === 'WARNING'
                        ? '#facc15'
                        : '#4ade80',
                    border: `1px solid ${
                      vessel.status === 'CRITICAL'
                        ? 'rgba(239, 68, 68, 0.4)'
                        : vessel.status === 'WARNING'
                        ? 'rgba(234, 179, 8, 0.4)'
                        : 'rgba(34, 197, 94, 0.4)'
                    }`,
                  }}
                >
                  {vessel.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                IMO {vessel.imoNumber} | {vessel.destination}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: GIS Map (Left) & Sensor Details (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: GIS Map */}
        <div
          style={{
            background: '#0f172a',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
              🗺️ 해양 GIS 선박 위치 및 항적 관제
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              선박 위치: {selectedVessel.position.lat.toFixed(4)}°N,{' '}
              {selectedVessel.position.lng.toFixed(4)}°E
            </span>
          </div>
          <MarineMap
            vessels={vessels}
            selectedVesselId={selectedVesselId}
            onSelectVessel={setSelectedVesselId}
            trackHistory={trackHistory[selectedVesselId] || []}
          />
        </div>

        {/* Right Column: Sensor Monitoring & Charts */}
        <div>
          {/* Facility Tab Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setFacilityTab('SCRUBBER')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: facilityTab === 'SCRUBBER' ? '#0284c7' : '#1e293b',
                color: facilityTab === 'SCRUBBER' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🚢 탈황 설비 (SOx Scrubber) 관제
            </button>
            <button
              onClick={() => setFacilityTab('BWTS')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: facilityTab === 'BWTS' ? '#0d9488' : '#1e293b',
                color: facilityTab === 'BWTS' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🌊 평형수 처리 (BWTS) 관제
            </button>
          </div>

          {/* Sensor Summary Cards */}
          <SensorCards scrubber={currentScrubber} bwts={currentBWTS} />

          {/* ECharts Telemetry Chart */}
          <div
            style={{
              background: '#0f172a',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              border: '1px solid #334155',
              marginTop: '16px',
            }}
          >
            <TelemetryChart facilityType={facilityTab} history={history} />
          </div>
        </div>
      </div>

      {/* Full Width Alarm Log */}
      <AlarmList alarms={alarms} onAcknowledge={handleAcknowledgeAlarm} />
    </div>
  );
};
