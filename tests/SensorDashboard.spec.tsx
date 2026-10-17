import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SensorDashboard } from '../src/components/Dashboard/SensorDashboard';

// Mock Leaflet and ECharts for fast 0ms testing
vi.mock('../src/components/Map/MarineMap', () => ({
  MarineMap: () => <div data-testid="marine-map-mock">MarineMap Mock</div>,
}));

vi.mock('../src/components/Chart/TelemetryChart', () => ({
  TelemetryChart: () => <div data-testid="telemetry-chart-mock">TelemetryChart Mock</div>,
}));

describe('SensorDashboard 2-Tier Mode & Store-and-Forward UI Integration', () => {
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

  it('네트워크 오프라인 토글 시 위성 링크 단절 상태가 반영되어야 한다', () => {
    render(<SensorDashboard />);

    const networkBtn = screen.getByTestId('network-toggle-btn');
    fireEvent.click(networkBtn);

    expect(screen.getByText(/위성 링크 단절 \(Offline\)/i)).toBeInTheDocument();
  });

  it('오프라인 상태에서 수동 동기화 버튼은 비활성화되어야 한다', () => {
    render(<SensorDashboard />);

    const networkBtn = screen.getByTestId('network-toggle-btn');
    fireEvent.click(networkBtn);

    const flushBtn = screen.getByRole('button', { name: /즉시 동기화/i });
    expect(flushBtn).toBeDisabled();
  });
});
