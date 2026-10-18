import React from 'react';
import {
  VesselInfo,
  ScrubberTelemetry,
  BWTSTelemetry,
  UserRole,
  OperatingMode,
  EquipmentHealthScore,
} from '../../types/telemetry';
import { MarineTheme } from '../../styles/theme';
import { MarineMap } from '../Map/MarineMap';
import { TelemetryChart } from '../Chart/TelemetryChart';
import { GaugeChart } from '../Chart/GaugeChart';
import { HeatmapChart } from '../Chart/HeatmapChart';
import { RadarChart } from '../Chart/RadarChart';
import { MetricCard } from '../Common/MetricCard';
import { SensorCards } from './SensorCards';
import { ShieldAlert, CheckCircle2, BarChart3, Activity, Droplets } from 'lucide-react';

export interface CloudAggregates {
  complianceRate: number;
  avgSox: number;
  maxSox: number;
  minPh: number;
  avgPh: number;
  avgTro: number;
  maxTro: number;
}

export interface SensorDashboardViewProps {
  vessels: VesselInfo[];
  selectedVessel: VesselInfo | undefined;
  onSelectVessel?: (vesselId: string) => void;
  facilityTab: 'SCRUBBER' | 'BWTS';
  onTabChange: (tab: 'SCRUBBER' | 'BWTS') => void;
  currentRole: UserRole;
  operatingMode: OperatingMode;
  currentScrubber: ScrubberTelemetry;
  currentBWTS: BWTSTelemetry;
  history: Array<{
    timestamp: string;
    scrubber: ScrubberTelemetry;
    bwts: BWTSTelemetry;
  }>;
  cloudAggregates: CloudAggregates;
  bypassValveOpen: boolean;
  onToggleBypass: () => void;
}

/**
 * 4대 직무별 시각화 위젯 레지스트리 (OCP & LSP 준수)
 * if-else 분기 제거 및 확장 가능한 전략 패턴 적용
 */
interface RoleWidgetRendererProps {
  currentRole: UserRole;
  operatingMode: OperatingMode;
  facilityTab: 'SCRUBBER' | 'BWTS';
  currentScrubber: ScrubberTelemetry;
  currentBWTS: BWTSTelemetry;
  cloudAggregates: CloudAggregates;
}

const renderRoleWidget = ({
  currentRole,
  operatingMode,
  facilityTab,
  currentScrubber,
  currentBWTS,
  cloudAggregates,
}: RoleWidgetRendererProps) => {
  switch (currentRole) {
    case 'COMPLIANCE_OFFICER':
      return (
        <div data-testid="compliance-role-widget">
          <HeatmapChart
            title="IMO / 선급 법정 환경 규제 임계치 초과 발생 빈도 (Violation Heatmap)"
            height="240px"
          />
        </div>
      );

    case 'DIAGNOSTIC_TECH': {
      const healthScore: EquipmentHealthScore = {
        vesselId: 'VSL-001',
        evaluatedAt: new Date().toISOString(),
        overallScore: Math.round(cloudAggregates.complianceRate * 0.9),
        cemsSensorReliability: currentScrubber.soxPpm < 21.7 ? 96 : 74,
        filterDpMargin: currentBWTS.troPpm < 0.1 ? 88 : 65,
        uvLampLifespan: 85,
        pumpEfficiency: 92,
        neutralizerStability: currentScrubber.phDischarge >= 6.5 ? 95 : 60,
        recommendations: [],
      };
      return (
        <div data-testid="diagnostic-role-widget">
          <RadarChart
            healthScore={healthScore}
            title="판호크 5축 설비 건전성 진단 (Equipment Health Radar)"
            height="260px"
          />
        </div>
      );
    }

    case 'FLEET_OPERATOR':
    case 'CHIEF_ENGINEER':
    default:
      return (
        <div data-testid="engineer-role-widget">
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
      );
  }
};

/**
 * SensorDashboardView: 순수 프레젠테이션 함수형 컴포넌트 ($UI = f(Props)$)
 * 부수 효과(0), React.memo 적용
 */
export const SensorDashboardView: React.FC<SensorDashboardViewProps> = React.memo(({
  vessels,
  selectedVessel,
  onSelectVessel,
  facilityTab,
  onTabChange,
  currentRole,
  operatingMode,
  currentScrubber,
  currentBWTS,
  history,
  cloudAggregates,
  bypassValveOpen,
  onToggleBypass,
}) => {
  return (
    <div className="flex flex-col gap-4 text-slate-100">
      {/* 긴급 바이패스 알림 배너 */}
      {bypassValveOpen && (
        <div className="bg-rose-950/70 border-2 border-rose-500 rounded-xl p-3.5 flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-rose-400 w-6 h-6 flex-shrink-0" />
            <div>
              <div className="font-bold text-rose-200 text-sm md:text-base">
                [비상] 비상 배기가스 바이패스 밸브(Emergency Bypass) 개방 상태
              </div>
              <div className="text-xs text-rose-300">
                스크러버 통과 없이 주기관 배기가스가 직배출 중입니다. 규제 위반 벌과금이 부과될 수 있습니다.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleBypass}
            className="marine-btn marine-btn-danger text-xs font-bold whitespace-nowrap"
          >
            즉시 밸브 차단
          </button>
        </div>
      )}

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Marine GIS Map & Track Info (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-marine-border flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-marine-primary">
                  🗺️ 해양 GIS 항적 & 선박 모니터링
                </span>
                {selectedVessel && (
                  <span className="marine-chip text-xs">
                    {selectedVessel.name} ({selectedVessel.callSign})
                  </span>
                )}
              </div>
              <span className="text-xs text-marine-secondary">
                좌표: {selectedVessel?.position.lat.toFixed(4)}°N, {selectedVessel?.position.lng.toFixed(4)}°E
              </span>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-700/60 h-[380px] md:h-[420px]">
              <MarineMap
                vessels={vessels}
                selectedVessel={selectedVessel}
                onSelectVessel={onSelectVessel}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Gauges, Role Widgets, Metric Cards & Charts (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 설비 탭 전환 (SOx Scrubber vs BWTS) */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-marine-border gap-1">
            <button
              type="button"
              onClick={() => onTabChange('SCRUBBER')}
              className={`flex-1 py-2.5 px-3 rounded-md font-bold text-xs md:text-sm min-h-[44px] transition-all cursor-pointer ${
                facilityTab === 'SCRUBBER'
                  ? 'bg-marine-cyan text-slate-950 shadow-sm'
                  : 'bg-transparent text-marine-secondary hover:text-white'
              }`}
            >
              🚢 탈황 설비 (Scrubber)
            </button>
            <button
              type="button"
              onClick={() => onTabChange('BWTS')}
              className={`flex-1 py-2.5 px-3 rounded-md font-bold text-xs md:text-sm min-h-[44px] transition-all cursor-pointer ${
                facilityTab === 'BWTS'
                  ? 'bg-marine-cyan text-slate-950 shadow-sm'
                  : 'bg-transparent text-marine-secondary hover:text-white'
              }`}
            >
              🌊 평형수 처리 (BWTS)
            </button>
          </div>

          {/* 4대 직무별 시각화 위젯 (선급 게이지 / 위반 히트맵 / 5축 레이더) */}
          <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
            {renderRoleWidget({
              currentRole,
              operatingMode,
              facilityTab,
              currentScrubber,
              currentBWTS,
              cloudAggregates,
            })}
          </div>

          {/* 관제 모드별 지표 분기: 클라우드 집계 vs 에지 10Hz Raw 센서 */}
          {operatingMode === 'CLOUD' ? (
            <div
              data-testid="cloud-aggregated-summary"
              className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md"
            >
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <span className="text-sm font-bold text-marine-cyan">
                  🏢 클라우드 1시간/24시간 집계 요약 및 환경 규제 이력
                </span>
                <span className="text-xs text-marine-muted">
                  동기화 완료 데이터 기준 통계
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <SensorCards scrubber={currentScrubber} bwts={currentBWTS} />
          )}

          {/* ECharts Telemetry Chart */}
          <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
              <span className="text-xs md:text-sm font-semibold text-marine-primary">
                {facilityTab === 'SCRUBBER'
                  ? '탈황 설비 (SOx Scrubber) 시계열 추이'
                  : '선박평형수 (BWTS) 시계열 추이'}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  operatingMode === 'EDGE'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-teal-950/40 text-teal-400 border-teal-500/30'
                }`}
              >
                {operatingMode === 'EDGE' ? '⚡ 10Hz 에지 실시간 파형' : '📊 클라우드 통계 집계 이력'}
              </span>
            </div>
            <TelemetryChart facilityType={facilityTab} history={history} />
          </div>
        </div>
      </div>
    </div>
  );
});

SensorDashboardView.displayName = 'SensorDashboardView';
