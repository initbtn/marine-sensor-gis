import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SensorDashboard } from '../src/components/Dashboard/SensorDashboard';
import { dualDbSyncEngine } from '../src/services/dualDbSyncEngine';

// Mock Leaflet and ECharts for fast 0ms testing
vi.mock('../src/components/Map/MarineMap', () => ({
  MarineMap: () => <div data-testid="marine-map-mock">MarineMap Mock</div>,
}));

vi.mock('../src/components/Chart/TelemetryChart', () => ({
  TelemetryChart: () => <div data-testid="telemetry-chart-mock">TelemetryChart Mock</div>,
}));

vi.mock('../src/components/Chart/GaugeChart', () => ({
  GaugeChart: () => <div data-testid="gauge-chart-mock">GaugeChart Mock</div>,
}));

describe('SensorDashboard 4대 직무 조립 & 2원화 HMI 관제 대시보드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ModeToggleBar가 대시보드 상단에 정상 마운트되어야 한다', () => {
    render(<SensorDashboard />);

    expect(screen.getByText('🚢 선박 로컬 에지')).toBeInTheDocument();
    expect(screen.getByText('🏢 내륙 클라우드')).toBeInTheDocument();
    expect(screen.getByTestId('network-toggle-btn')).toBeInTheDocument();
  });

  it('클라우드 모드로 전환 시 클라우드 모드 안내 및 지표가 표시되어야 한다', () => {
    render(<SensorDashboard />);

    const cloudBtn = screen.getByText('🏢 내륙 클라우드');
    fireEvent.click(cloudBtn);

    expect(screen.getByText(/1분\/1시간 통계 집계/i)).toBeInTheDocument();
  });

  it('네트워크 오프라인 토글 시 dualDbSyncEngine.setSatelliteLink(false)가 호출되고 위성 링크 단절이 반영되어야 한다', async () => {
    const setLinkSpy = vi.spyOn(dualDbSyncEngine, 'setSatelliteLink');
    render(<SensorDashboard />);

    const networkBtn = screen.getByTestId('network-toggle-btn');
    fireEvent.click(networkBtn);

    expect(setLinkSpy).toHaveBeenCalledWith(false);
    expect(screen.getByText(/위성 링크 단절 \(Offline\)/i)).toBeInTheDocument();
  });

  it('오프라인 상태에서 수동 동기화 버튼은 비활성화되어야 한다', () => {
    render(<SensorDashboard />);

    const networkBtn = screen.getByTestId('network-toggle-btn');
    fireEvent.click(networkBtn);

    const flushBtn = screen.getByRole('button', { name: /즉시 동기화/i });
    expect(flushBtn).toBeDisabled();
  });

  it('RoleSwitcher 4대 직무 스위처가 렌더링되고 역할 전환이 가능해야 한다', () => {
    render(<SensorDashboard />);

    expect(screen.getByText('선박 기관사')).toBeInTheDocument();
    expect(screen.getByText('육상 관제관')).toBeInTheDocument();
    expect(screen.getByText('규제 감사관')).toBeInTheDocument();

    const inspectorBtn = screen.getByTestId('role-btn-compliance_officer');
    fireEvent.click(inspectorBtn);

    expect(inspectorBtn).toHaveStyle({ backgroundColor: 'rgb(0, 245, 212)' });
  });

  it('MetricCard 기반 디자인 시스템 센서 카드가 렌더링되어야 한다', () => {
    render(<SensorDashboard />);

    expect(screen.getByTestId('metric-card-배기가스-sox')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-배출-세정수-ph')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-배출수-탁도')).toBeInTheDocument();
  });

  it('비상 바이패스 밸브 제어 버튼이 렌더링되어야 한다', () => {
    render(<SensorDashboard />);

    const bypassBtn = screen.getByRole('button', { name: /비상 바이패스/i });
    expect(bypassBtn).toBeInTheDocument();
  });
});
