import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  VesselInfo,
  ScrubberTelemetry,
  BWTSTelemetry,
  AlarmEvent,
  UserRole,
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
import { useTelemetryStream } from '../../hooks/useTelemetryStream';
import { MarineTheme } from '../../styles/theme';
import { MarineMap } from '../Map/MarineMap';
import { TelemetryChart } from '../Chart/TelemetryChart';
import { GaugeChart } from '../Chart/GaugeChart';
import { RoleSwitcher } from '../Common/RoleSwitcher';
import { MetricCard } from '../Common/MetricCard';
import { SensorCards } from './SensorCards';
import { AlarmList } from './AlarmList';
import {
  ModeToggleBar,
  OperatingMode,
  NetworkStatus,
  SyncState,
} from './ModeToggleBar';
import { ShieldAlert, CheckCircle2, BarChart3, Activity, Droplets } from 'lucide-react';

export const SensorDashboard: React.FC = () => {
  const [vessels, setVessels] = useState<VesselInfo[]>(INITIAL_VESSELS);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('VSL-001');
  const [facilityTab, setFacilityTab] = useState<'SCRUBBER' | 'BWTS'>('SCRUBBER');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('CHIEF_ENGINEER');

  // 2원화 관제 모드 및 위성 네트워크 / 동기화 상태
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('EDGE');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('ONLINE');
  const [syncStatus, setSyncStatus] = useState<SyncState>('IDLE');
  const [pendingCount, setPendingCount] = useState<number>(() =>
    dualDbSyncEngine.getQueueLength()
  );

  // 실시간 10Hz GCP 선박 엣지 데몬 스트림 및 다운링크 제어 연동
  const edgeStream = useTelemetryStream({
    autoPoll: isStreaming && networkStatus === 'ONLINE',
    pollIntervalMs: 2000,
  });

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

  // 🏢 클라우드 모드: 시간대별 통계 집계치 및 당월 환경 규제 준수율 계산
  const cloudAggregates = useMemo(() => {
    const soxValues = history.map((h) => h.scrubber.soxPpm);
    const avgSox = soxValues.length > 0
      ? Number((soxValues.reduce((a, b) => a + b, 0) / soxValues.length).toFixed(1))
      : 14.2;
    const maxSox = soxValues.length > 0 ? Number(Math.max(...soxValues).toFixed(1)) : 19.8;

    const phValues = history.map((h) => h.scrubber.phDischarge);
    const avgPh = phValues.length > 0
      ? Number((phValues.reduce((a, b) => a + b, 0) / phValues.length).toFixed(2))
      : 6.85;
    const minPh = phValues.length > 0 ? Number(Math.min(...phValues).toFixed(2)) : 6.62;

    const troValues = history.map((h) => h.bwts.troPpm);
    const avgTro = troValues.length > 0
      ? Number((troValues.reduce((a, b) => a + b, 0) / troValues.length).toFixed(3))
      : 0.042;
    const maxTro = troValues.length > 0 ? Number(Math.max(...troValues).toFixed(3)) : 0.078;

    return {
      complianceRate: MarineTheme.thresholds.complianceRateTargetPct, // 99.5%
      avgSox,
      maxSox,
      avgPh,
      minPh,
      avgTro,
      maxTro,
    };
  }, [history]);

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

  // 네트워크 상태 토글 핸들러 (오프라인 큐 버그 패치)
  const handleToggleNetwork = useCallback(async () => {
    const next = networkStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setNetworkStatus(next);
    await dualDbSyncEngine.setSatelliteLink(next === 'ONLINE');
    if (next === 'ONLINE') {
      // 온라인 복구 시 자동 백그라운드 동기화 트리거
      await dualDbSyncEngine.flushSyncQueue();
      setPendingCount(dualDbSyncEngine.getQueueLength());
    }
  }, [networkStatus]);

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

      // 3. 센서 데이터 갱신 (GCP 엣지 데몬 라이브 데이터 우선 바인딩)
      let newScrubber: ScrubberTelemetry;
      let newBWTS: BWTSTelemetry;

      if (edgeStream.telemetry && networkStatus === 'ONLINE' && selectedVesselId === 'VSL-001') {
        const live = edgeStream.telemetry;
        newScrubber = generateScrubberTelemetry({
          soxPpm: Number((live.scrubber_so2_co2_ratio * 4.2).toFixed(2)),
          phDischarge: live.scrubber_ph,
          turbidityFtu: live.scrubber_turbidity,
          pressureDropKpa: Number((live.scrubber_dp * 10).toFixed(1)),
        });
        newBWTS = generateBWTSTelemetry({
          filterPressureKpa: Number((live.bwts_filter_dp * 100).toFixed(1)),
          troPpm: live.bwts_tro,
        });
      } else {
        newScrubber = generateScrubberTelemetry();
        newBWTS = generateBWTSTelemetry();
      }

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
  }, [isStreaming, selectedVesselId, selectedVessel, networkStatus, edgeStream.telemetry]);

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
        color: MarineTheme.colors.textPrimary,
        background: MarineTheme.colors.bgPrimary,
      }}
    >
      {/* 1. Header with Role Switcher */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
          borderBottom: `2px solid ${MarineTheme.colors.border}`,
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: MarineTheme.colors.textPrimary }}>
            🌊 해양 친환경 설비 실시간 센서 모니터링 &amp; GIS 관제 웹 플랫폼
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: MarineTheme.colors.textSecondary }}>
            IMO 탈황 규제(MARPOL Annex VI) &amp; 선박평형수(BWTS D-2) 실시간 텔레메트리 관제 시스템
          </p>
        </div>

        {/* 4대 직무 역할 전환기 */}
        <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* 다운링크 원격 바이패스 제어 버튼 */}
          <button
            type="button"
            onClick={() => edgeStream.toggleBypass()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: `1px solid ${MarineTheme.colors.criticalCrimson}`,
              background: 'rgba(231, 29, 54, 0.15)',
              color: MarineTheme.colors.criticalCrimson,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <ShieldAlert size={14} />
            비상 바이패스 (Bypass)
          </button>

          {/* 스트리밍 일시정지/재개 */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isStreaming ? MarineTheme.colors.criticalCrimson : MarineTheme.colors.ecoCyan,
              color: isStreaming ? '#ffffff' : '#000000',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {isStreaming ? '⏸ 스트리밍 일시정지' : '▶ 실시간 스트리밍 재개'}
          </button>
        </div>
      </header>

      {/* 2. 2원화 HMI 관제 모드 및 위성 네트워크 / 동기화 바 */}
      <ModeToggleBar
        operatingMode={operatingMode}
        networkStatus={networkStatus}
        syncStatus={syncStatus}
        pendingCount={pendingCount}
        onToggleOperatingMode={setOperatingMode}
        onToggleNetworkStatus={handleToggleNetwork}
        onManualFlush={handleManualFlush}
      />

      {/* 3. Vessel Selector Strip */}
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
                border: isSelected ? `2px solid ${MarineTheme.colors.ecoCyan}` : `1px solid ${MarineTheme.colors.border}`,
                background: isSelected ? MarineTheme.colors.bgSecondary : MarineTheme.colors.bgCard,
                boxShadow: isSelected ? '0 2px 8px rgba(0, 245, 212, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: MarineTheme.colors.textPrimary }}>{vessel.name}</strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      vessel.status === 'CRITICAL'
                        ? 'rgba(231, 29, 54, 0.2)'
                        : vessel.status === 'WARNING'
                        ? 'rgba(255, 159, 28, 0.2)'
                        : 'rgba(0, 245, 212, 0.2)',
                    color:
                      vessel.status === 'CRITICAL'
                        ? MarineTheme.colors.criticalCrimson
                        : vessel.status === 'WARNING'
                        ? MarineTheme.colors.warningAmber
                        : MarineTheme.colors.ecoCyan,
                    border: `1px solid ${
                      vessel.status === 'CRITICAL'
                        ? MarineTheme.colors.criticalCrimson
                        : vessel.status === 'WARNING'
                        ? MarineTheme.colors.warningAmber
                        : MarineTheme.colors.ecoCyan
                    }`,
                  }}
                >
                  {vessel.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: MarineTheme.colors.textSecondary, marginTop: '4px' }}>
                IMO {vessel.imoNumber} | {vessel.destination}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Main Grid: GIS Map (Left) & Sensor Details with Gauges (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: GIS Map */}
        <div
          style={{
            background: MarineTheme.colors.bgCard,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${MarineTheme.colors.border}`,
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
            <h3 style={{ margin: 0, fontSize: '16px', color: MarineTheme.colors.textPrimary }}>
              🗺️ 해양 GIS 선박 위치 및 항적 관제
            </h3>
            <span style={{ fontSize: '12px', color: MarineTheme.colors.textSecondary }}>
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

        {/* Right Column: Sensor Monitoring & Gauges */}
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
                background: facilityTab === 'SCRUBBER' ? MarineTheme.colors.ecoCyan : MarineTheme.colors.bgCard,
                color: facilityTab === 'SCRUBBER' ? '#000000' : MarineTheme.colors.textSecondary,
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
                background: facilityTab === 'BWTS' ? MarineTheme.colors.ecoCyan : MarineTheme.colors.bgCard,
                color: facilityTab === 'BWTS' ? '#000000' : MarineTheme.colors.textSecondary,
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🌊 평형수 처리 (BWTS) 관제
            </button>
          </div>

          {/* 선급 규제 게이지 차트 (GaugeChart) */}
          <div
            style={{
              background: MarineTheme.colors.bgCard,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${MarineTheme.colors.border}`,
              marginBottom: '16px',
            }}
          >
            {operatingMode === 'CLOUD' ? (
              <GaugeChart
                title="당월 IMO 종합 환경 규제 준수율 (MARPOL & D-2)"
                value={cloudAggregates.complianceRate}
                unit="%"
                type="GENERIC"
                min={90}
                max={100}
                thresholdValue={MarineTheme.thresholds.complianceRateTargetPct}
                thresholdLabel={`목표치 ${MarineTheme.thresholds.complianceRateTargetPct}% 이상`}
                height="220px"
              />
            ) : facilityTab === 'SCRUBBER' ? (
              <GaugeChart
                title="SOx 배출 농도 게이지 (IMO Annex VI)"
                value={currentScrubber.soxPpm}
                unit="ppm"
                type="SOX"
                thresholdValue={MarineTheme.thresholds.soxGlobalPpm}
                thresholdLabel="Global 한도 21.7 ppm"
                height="220px"
              />
            ) : (
              <GaugeChart
                title="BWTS 잔류 산화물질 농도 (IMO D-2)"
                value={currentBWTS.troPpm}
                unit="ppm"
                type="GENERIC"
                min={0}
                max={0.5}
                thresholdValue={MarineTheme.thresholds.troMaxPpm}
                thresholdLabel="허용 한도 0.1 ppm"
                height="220px"
              />
            )}
          </div>

          {/* 관제 모드별 지표 분기: 클라우드 집계 요약치 vs 선박 에지 10Hz Raw 센서 */}
          {operatingMode === 'CLOUD' ? (
            <div
              data-testid="cloud-aggregated-summary"
              style={{
                background: MarineTheme.colors.bgCard,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${MarineTheme.colors.border}`,
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 700, color: MarineTheme.colors.ecoCyan }}>
                  🏢 클라우드 1시간/24시간 집계 요약 및 환경 규제 이력
                </span>
                <span style={{ fontSize: '11px', color: MarineTheme.colors.textMuted }}>
                  동기화 완료 데이터 기준 통계
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <MetricCard
                  title="당월 환경 규제 준수율"
                  value={cloudAggregates.complianceRate}
                  unit="%"
                  status="INFO"
                  icon={<CheckCircle2 size={16} />}
                  thresholdNotice={`목표치 ${MarineTheme.thresholds.complianceRateTargetPct}% 이상`}
                  subtext="IMO MARPOL & D-2 전 선대 집계"
                />
                <MetricCard
                  title="24h SOx 평균 배출"
                  value={cloudAggregates.avgSox}
                  unit="ppm"
                  status="INFO"
                  icon={<Activity size={16} />}
                  thresholdNotice={`피크 ${cloudAggregates.maxSox} ppm / 한도 21.7`}
                  subtext="시간당 이동 평균"
                />
                <MetricCard
                  title="24h 세정수 pH 평균"
                  value={cloudAggregates.avgPh}
                  unit="pH"
                  status="INFO"
                  icon={<Droplets size={16} />}
                  thresholdNotice={`최저 ${cloudAggregates.minPh} pH / 기준 >= 6.5`}
                  subtext="연속 배출 모니터링 집계"
                />
                <MetricCard
                  title="24h BWTS TRO 평균"
                  value={cloudAggregates.avgTro}
                  unit="ppm"
                  status="INFO"
                  icon={<BarChart3 size={16} />}
                  thresholdNotice={`피크 ${cloudAggregates.maxTro} ppm / 한도 <= 0.1`}
                  subtext="밸러스트 펌프 가동 구간"
                />
              </div>
            </div>
          ) : (
            /* MetricCard 기반 디자인 시스템 센서 카드 그리드 (에지 10Hz/실시간 Raw) */
            <SensorCards scrubber={currentScrubber} bwts={currentBWTS} />
          )}

          {/* ECharts Telemetry Chart */}
          <div
            style={{
              background: MarineTheme.colors.bgCard,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${MarineTheme.colors.border}`,
              marginTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: MarineTheme.colors.textPrimary }}>
                {facilityTab === 'SCRUBBER'
                  ? '탈황 설비 (SOx Scrubber) 시계열 추이'
                  : '선박평형수 (BWTS) 시계열 추이'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background:
                    operatingMode === 'EDGE'
                      ? 'rgba(0, 245, 212, 0.15)'
                      : 'rgba(13, 148, 136, 0.2)',
                  color: operatingMode === 'EDGE' ? MarineTheme.colors.ecoCyan : '#2dd4bf',
                  border: `1px solid ${operatingMode === 'EDGE' ? MarineTheme.colors.ecoCyan : '#0d9488'}`,
                }}
              >
                {operatingMode === 'EDGE' ? '⚡ 10Hz 에지 실시간 파형' : '📊 클라우드 통계 집계 이력'}
              </span>
            </div>
            <TelemetryChart facilityType={facilityTab} history={history} />
          </div>
        </div>
      </div>

      {/* 5. Full Width Alarm Log */}
      <AlarmList alarms={alarms} onAcknowledge={handleAcknowledgeAlarm} />
    </div>
  );
};
