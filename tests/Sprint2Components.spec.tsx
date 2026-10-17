import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBadge } from '../src/components/Common/AlertBadge';
import { MetricCard } from '../src/components/Common/MetricCard';
import { RoleSwitcher } from '../src/components/Common/RoleSwitcher';
import { GaugeChart } from '../src/components/Chart/GaugeChart';
import { RadarChart } from '../src/components/Chart/RadarChart';
import { HeatmapChart } from '../src/components/Chart/HeatmapChart';
import { EquipmentHealthScore } from '../src/types/telemetry';

// JSDOM 환경에서 ECharts 렌더링 모킹
vi.mock('echarts-for-react', () => ({
  default: ({ option, style }: any) => (
    <div data-testid="echarts-mock" style={style}>
      {JSON.stringify(option?.title || option?.series?.[0]?.name || {})}
    </div>
  ),
}));

describe('Sprint 2: Common UI & Data Visualization Component Tests', () => {
  describe('AlertBadge Component', () => {
    it('CRITICAL 등급 시 적색 배지와 점멸 속성을 반영해야 한다', () => {
      render(<AlertBadge level="CRITICAL" blinking={true} />);
      const badge = screen.getByTestId('alert-badge-critical');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('animate-pulse');
      expect(badge).toHaveTextContent('CRITICAL');
    });

    it('커스텀 레이블이 주어지면 정상 렌더링되어야 한다', () => {
      render(<AlertBadge level="INFO" label="ECA COMPLIANT" />);
      const badge = screen.getByTestId('alert-badge-info');
      expect(badge).toHaveTextContent('ECA COMPLIANT');
    });
  });

  describe('MetricCard Component', () => {
    it('산업용 메트릭 수치와 IMO 규제 임계치 안내를 정상 표시해야 한다', () => {
      render(
        <MetricCard
          title="배출가스 SOx 농도"
          value={1.85}
          unit="ppm"
          status="INFO"
          thresholdNotice="IMO MARPOL ECA 한계: 4.3 ppm"
        />
      );

      expect(screen.getByText('배출가스 SOx 농도')).toBeInTheDocument();
      expect(screen.getByText('1.85')).toBeInTheDocument();
      expect(screen.getByText('ppm')).toBeInTheDocument();
      expect(screen.getByText(/IMO MARPOL ECA 한계/)).toBeInTheDocument();
    });
  });

  describe('RoleSwitcher Component', () => {
    it('4대 직무 버튼을 모두 표시하고 클릭 시 onRoleChange를 호출해야 한다', () => {
      const handleRoleChange = vi.fn();
      render(
        <RoleSwitcher
          currentRole="CHIEF_ENGINEER"
          onRoleChange={handleRoleChange}
        />
      );

      expect(screen.getByText('선박 기관사')).toBeInTheDocument();
      expect(screen.getByText('육상 관제관')).toBeInTheDocument();
      expect(screen.getByText('규제 감사관')).toBeInTheDocument();
      expect(screen.getByText('원격 진단원')).toBeInTheDocument();

      const complianceBtn = screen.getByTestId('role-btn-compliance_officer');
      fireEvent.click(complianceBtn);
      expect(handleRoleChange).toHaveBeenCalledWith('COMPLIANCE_OFFICER');
    });
  });

  describe('GaugeChart Component', () => {
    it('SOX 게이지 및 임계치 라벨을 포함하여 렌더링되어야 한다', () => {
      render(
        <GaugeChart
          title="SOx 배출 농도"
          value={2.1}
          unit="ppm"
          type="SOX"
          isEcaMode={true}
          thresholdLabel="ECA: 4.3 ppm"
        />
      );

      expect(screen.getByText('SOx 배출 농도')).toBeInTheDocument();
      expect(screen.getByText('ECA: 4.3 ppm')).toBeInTheDocument();
      expect(screen.getByTestId('gauge-chart-sox-배출-농도')).toBeInTheDocument();
    });
  });

  describe('RadarChart Component', () => {
    it('판호크 5축 건전성 지표와 종합 평점을 정상 렌더링해야 한다', () => {
      const mockHealth: EquipmentHealthScore = {
        vesselId: 'VSL-001',
        evaluatedAt: new Date().toISOString(),
        overallScore: 88,
        cemsSensorReliability: 95,
        filterDpMargin: 78,
        uvLampLifespan: 82,
        pumpEfficiency: 90,
        neutralizerStability: 95,
        recommendations: [],
      };

      render(<RadarChart healthScore={mockHealth} />);
      expect(screen.getByText(/종합 평점: 88점/)).toBeInTheDocument();
      expect(screen.getByTestId('radar-chart-equipment-health')).toBeInTheDocument();
    });
  });

  describe('HeatmapChart Component', () => {
    it('시간대별 위반 매트릭스 히트맵 컨테이너가 렌더링되어야 한다', () => {
      render(<HeatmapChart />);
      expect(screen.getByTestId('heatmap-chart-violation')).toBeInTheDocument();
    });
  });
});
