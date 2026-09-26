import React, { useState, useEffect, useMemo } from 'react';
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
import { MarineMap } from '../Map/MarineMap';
import { TelemetryChart } from '../Chart/TelemetryChart';
import { SensorCards } from './SensorCards';
import { AlarmList } from './AlarmList';

export const SensorDashboard: React.FC = () => {
  const [vessels, setVessels] = useState<VesselInfo[]>(INITIAL_VESSELS);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('VSL-001');
  const [facilityTab, setFacilityTab] = useState<'SCRUBBER' | 'BWTS'>('SCRUBBER');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  // 선택된 선박의 텔레메트리 상태 및 이력
  const [currentScrubber, setCurrentScrubber] = useState<ScrubberTelemetry>(() => generateScrubberTelemetry());
  const [currentBWTS, setCurrentBWTS] = useState<BWTSTelemetry>(() => generateBWTSTelemetry());
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
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming, selectedVesselId, selectedVessel]);

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, acknowledged: true } : a))
    );
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
            🌊 해양 친환경 설비 실시간 센서 모니터링 &amp; GIS 관제 웹 플랫폼
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
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

      {/* Vessel Selector Strip */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
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
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#ffffff',
                boxShadow: isSelected ? '0 2px 4px rgba(59,130,246,0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{vessel.name}</strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      vessel.status === 'CRITICAL'
                        ? '#fee2e2'
                        : vessel.status === 'WARNING'
                        ? '#fef3c7'
                        : '#dcfce7',
                    color:
                      vessel.status === 'CRITICAL'
                        ? '#b91c1c'
                        : vessel.status === 'WARNING'
                        ? '#b45309'
                        : '#15803d',
                  }}
                >
                  {vessel.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                IMO {vessel.imoNumber} | {vessel.destination}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: GIS Map (Left) & Sensor Details (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: GIS Map */}
        <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>🗺️ 해양 GIS 선박 위치 및 항적 관제</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              선박 위치: {selectedVessel.position.lat.toFixed(4)}°N, {selectedVessel.position.lng.toFixed(4)}°E
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
                background: facilityTab === 'SCRUBBER' ? '#1e293b' : '#e2e8f0',
                color: facilityTab === 'SCRUBBER' ? '#ffffff' : '#475569',
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
                background: facilityTab === 'BWTS' ? '#1e293b' : '#e2e8f0',
                color: facilityTab === 'BWTS' ? '#ffffff' : '#475569',
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
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginTop: '16px' }}>
            <TelemetryChart facilityType={facilityTab} history={history} />
          </div>
        </div>
      </div>

      {/* Full Width Alarm Log */}
      <AlarmList alarms={alarms} onAcknowledge={handleAcknowledgeAlarm} />
    </div>
  );
};
