import React from 'react';
import { ScrubberTelemetry, BWTSTelemetry } from '../../types/telemetry';
import { MarineTheme } from '../../styles/theme';
import { MetricCard } from '../Common/MetricCard';
import { Gauge, Droplets, Activity, Zap, Waves, Flame } from 'lucide-react';

interface SensorCardsProps {
  scrubber: ScrubberTelemetry;
  bwts: BWTSTelemetry;
}

export const SensorCards: React.FC<SensorCardsProps> = ({ scrubber, bwts }) => {
  const isSoxAlert = scrubber.soxPpm > MarineTheme.thresholds.soxGlobalPpm;
  const isPhAlert = scrubber.phDischarge < MarineTheme.thresholds.washwaterPhMin;
  const isTurbidityAlert = scrubber.turbidityFtu > MarineTheme.thresholds.turbidityMaxNtu;
  const isFilterAlert = bwts.filterPressureKpa > 70;
  const isTroAlert = bwts.troPpm > MarineTheme.thresholds.troMaxPpm;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
      {/* 1. Scrubber Group */}
      <div
        style={{
          background: MarineTheme.colors.bgPrimary,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${MarineTheme.colors.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: `1px solid ${MarineTheme.colors.border}`,
            paddingBottom: '8px',
          }}
        >
          <h4 style={{ margin: 0, color: MarineTheme.colors.textPrimary, fontSize: '15px', fontWeight: 600 }}>
            🚢 탈황 설비 (SOx Scrubber)
          </h4>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 700,
              background: isPhAlert || isSoxAlert ? 'rgba(231, 29, 54, 0.2)' : 'rgba(0, 245, 212, 0.15)',
              color: isPhAlert || isSoxAlert ? MarineTheme.colors.criticalCrimson : MarineTheme.colors.ecoCyan,
              border: `1px solid ${isPhAlert || isSoxAlert ? MarineTheme.colors.criticalCrimson : MarineTheme.colors.ecoCyan}`,
            }}
          >
            {isPhAlert || isSoxAlert ? '규제 경보 감지' : '정상 운항 (Compliant)'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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

      {/* 2. BWTS Group */}
      <div
        style={{
          background: MarineTheme.colors.bgPrimary,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${MarineTheme.colors.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: `1px solid ${MarineTheme.colors.border}`,
            paddingBottom: '8px',
          }}
        >
          <h4 style={{ margin: 0, color: MarineTheme.colors.textPrimary, fontSize: '15px', fontWeight: 600 }}>
            🌊 평형수 처리 (BWTS)
          </h4>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 700,
              background: isFilterAlert || isTroAlert ? 'rgba(255, 159, 28, 0.2)' : 'rgba(0, 245, 212, 0.15)',
              color: isFilterAlert || isTroAlert ? MarineTheme.colors.warningAmber : MarineTheme.colors.ecoCyan,
              border: `1px solid ${isFilterAlert || isTroAlert ? MarineTheme.colors.warningAmber : MarineTheme.colors.ecoCyan}`,
            }}
          >
            {isFilterAlert ? '필터 차압 주의' : isTroAlert ? 'TRO 초과 경보' : '살균 적합 (Compliant)'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
    </div>
  );
};
