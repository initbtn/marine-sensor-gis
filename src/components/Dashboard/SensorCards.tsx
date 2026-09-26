import React from 'react';
import { ScrubberTelemetry, BWTSTelemetry } from '../../types/telemetry';

interface SensorCardsProps {
  scrubber: ScrubberTelemetry;
  bwts: BWTSTelemetry;
}

export const SensorCards: React.FC<SensorCardsProps> = ({ scrubber, bwts }) => {
  const isSoxAlert = scrubber.soxPpm > 20;
  const isPhAlert = scrubber.phDischarge < 6.5;
  const isTurbidityAlert = scrubber.turbidityFtu > 20;
  const isFilterAlert = bwts.filterPressureKpa > 70;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '16px 0' }}>
      {/* Scrubber Card */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>🚢 탈황 설비 (SOx Scrubber)</h4>
          <span style={{ fontSize: '11px', background: isPhAlert ? '#fee2e2' : '#dcfce7', color: isPhAlert ? '#b91c1c' : '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            {isPhAlert ? '경보 발생' : '정상 가동'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
          <div>
            <div style={{ color: '#64748b' }}>배기가스 SOx</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSoxAlert ? '#dc2626' : '#0f172a' }}>
              {scrubber.soxPpm} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>ppm</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>배출 세정수 pH</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isPhAlert ? '#dc2626' : '#0284c7' }}>
              {scrubber.phDischarge} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(기준 &ge;6.5)</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>세정수 유량</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              {scrubber.washwaterFlowM3h} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>m³/h</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>배출수 탁도</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isTurbidityAlert ? '#d97706' : '#0f172a' }}>
              {scrubber.turbidityFtu} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>FTU</span>
            </div>
          </div>
        </div>
      </div>

      {/* BWTS Card */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>🌊 평형수 처리 (BWTS)</h4>
          <span style={{ fontSize: '11px', background: isFilterAlert ? '#fef3c7' : '#dcfce7', color: isFilterAlert ? '#b45309' : '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            {isFilterAlert ? '차압 주의' : '정상 주입'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
          <div>
            <div style={{ color: '#64748b' }}>처리 유량</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              {bwts.flowRateM3h} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>m³/h</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>잔류 산화물 (TRO)</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
              {bwts.troPpm} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>ppm</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>여과기 차압</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isFilterAlert ? '#d97706' : '#0f172a' }}>
              {bwts.filterPressureKpa} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>kPa</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>설비 전력 소모</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              {bwts.powerConsumptionKw} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>kW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
