import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SensorCards } from '../src/components/Dashboard/SensorCards';
import { generateScrubberTelemetry, generateBWTSTelemetry } from '../src/services/mockTelemetry';

describe('SensorCards Component Tests', () => {
  it('Scrubber 및 BWTS 센서 수치를 화면에 정상 렌더링해야 한다', () => {
    const scrubber = generateScrubberTelemetry({
      soxPpm: 15.2,
      phDischarge: 7.1,
      washwaterFlowM3h: 1250,
      turbidityFtu: 12.0,
    });
    const bwts = generateBWTSTelemetry({
      flowRateM3h: 520,
      troPpm: 0.125,
      filterPressureKpa: 42.0,
      powerConsumptionKw: 45,
    });

    render(<SensorCards scrubber={scrubber} bwts={bwts} />);

    expect(screen.getByText('🚢 탈황 설비 (SOx Scrubber)')).toBeInTheDocument();
    expect(screen.getByText('🌊 평형수 처리 (BWTS)')).toBeInTheDocument();
    expect(screen.getByText('15.2')).toBeInTheDocument();
    expect(screen.getByText('7.1')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
    expect(screen.getByText('520')).toBeInTheDocument();
    expect(screen.getByText('0.125')).toBeInTheDocument();
  });
});
