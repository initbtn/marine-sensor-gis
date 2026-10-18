import React from 'react';
import { ScrubberTelemetry, BWTSTelemetry } from '../../types/telemetry';
import { MarineTheme } from '../../styles/theme';
import { MetricCard } from '../Common/MetricCard';
import { Gauge, Droplets, Activity, Zap, Waves, Flame } from 'lucide-react';

interface SensorCardsProps {
  scrubber: ScrubberTelemetry;
  bwts: BWTSTelemetry;
  activeFacility?: 'SCRUBBER' | 'BWTS' | 'ALL';
  className?: string;
}

export const SensorCards: React.FC<SensorCardsProps> = ({
  scrubber,
  bwts,
  activeFacility = 'ALL',
  className = '',
}) => {
  const isSoxAlert = scrubber.soxPpm > MarineTheme.thresholds.soxGlobalPpm;
  const isPhAlert = scrubber.phDischarge < MarineTheme.thresholds.washwaterPhMin;
  const isTurbidityAlert = scrubber.turbidityFtu > MarineTheme.thresholds.turbidityMaxNtu;
  const isFilterAlert = bwts.filterPressureKpa > 70;
  const isTroAlert = bwts.troPpm > MarineTheme.thresholds.troMaxPpm;

  const showScrubber = activeFacility === 'ALL' || activeFacility === 'SCRUBBER';
  const showBwts = activeFacility === 'ALL' || activeFacility === 'BWTS';

  return (
    <div className={`flex flex-col gap-4 my-4 ${className}`}>
      {/* 1. Scrubber Group */}
      {showScrubber && (
      <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-marine-border">
          <h4 className="m-0 text-marine-primary text-sm md:text-base font-semibold">
            🚢 탈황 설비 (SOx Scrubber)
          </h4>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isPhAlert || isSoxAlert
                ? 'bg-rose-950/40 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isPhAlert || isSoxAlert ? '규제 경보 감지' : '정상 운항 (Compliant)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="배기가스 SOx"
            value={scrubber.soxPpm}
            unit="ppm"
            status={isSoxAlert ? 'CRITICAL' : 'INFO'}
            icon={<Flame size={16} />}
            thresholdNotice={`IMO 한도 <= ${MarineTheme.thresholds.soxGlobalPpm} ppm`}
          />
          <MetricCard
            title="배출 세정수 pH"
            value={scrubber.phDischarge}
            unit="pH"
            status={isPhAlert ? 'CRITICAL' : 'INFO'}
            icon={<Droplets size={16} />}
            thresholdNotice={`선외 배출 최저 >= ${MarineTheme.thresholds.washwaterPhMin}`}
          />
          <MetricCard
            title="세정수 유량"
            value={scrubber.washwaterFlowM3h}
            unit="m³/h"
            status="INFO"
            icon={<Activity size={16} />}
            thresholdNotice="세정 타워 연속 순환"
          />
          <MetricCard
            title="배출수 탁도"
            value={scrubber.turbidityFtu}
            unit="FTU"
            status={isTurbidityAlert ? 'WARNING' : 'INFO'}
            icon={<Waves size={16} />}
            thresholdNotice={`상승 한도 <= ${MarineTheme.thresholds.turbidityMaxNtu} FTU`}
          />
        </div>
      </div>
      )}

      {/* 2. BWTS Group */}
      {showBwts && (
      <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-marine-border">
          <h4 className="m-0 text-marine-primary text-sm md:text-base font-semibold">
            🌊 평형수 처리 (BWTS)
          </h4>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isFilterAlert || isTroAlert
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isFilterAlert ? '필터 차압 주의' : isTroAlert ? 'TRO 초과 경보' : '살균 적합 (Compliant)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="평형수 유량"
            value={bwts.flowRateM3h}
            unit="m³/h"
            status="INFO"
            icon={<Activity size={16} />}
            thresholdNotice="주입/배출 펌프 가동"
          />
          <MetricCard
            title="잔류 산화물 (TRO)"
            value={bwts.troPpm}
            unit="ppm"
            status={isTroAlert ? 'CRITICAL' : 'INFO'}
            icon={<Droplets size={16} />}
            thresholdNotice={`IMO D-2 한도 <= ${MarineTheme.thresholds.troMaxPpm} ppm`}
          />
          <MetricCard
            title="여과기 차압"
            value={bwts.filterPressureKpa}
            unit="kPa"
            status={isFilterAlert ? 'WARNING' : 'INFO'}
            icon={<Gauge size={16} />}
            thresholdNotice="100 kPa 이상 시 자동 역세척"
          />
          <MetricCard
            title="설비 전력 소모"
            value={bwts.powerConsumptionKw}
            unit="kW"
            status="INFO"
            icon={<Zap size={16} />}
            thresholdNotice="UV 챔버 & 펌프 모터"
          />
        </div>
      </div>
      )}
    </div>
  );
};
