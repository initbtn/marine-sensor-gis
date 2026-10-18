import React from 'react';
import ReactECharts from 'echarts-for-react';
import { MarineTheme } from '../../styles/theme';
import { EquipmentHealthScore } from '../../types/telemetry';

interface RadarChartProps {
  healthScore: EquipmentHealthScore;
  title?: string;
  height?: string;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  healthScore,
  title = '판호크 5축 설비 건전성 진단 (Equipment Health Radar)',
  height = '320px',
  className = '',
}) => {
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: {
        color: MarineTheme.colors.textPrimary,
        fontSize: 13,
        fontWeight: 'bold',
      },
      top: 10,
      left: 10,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: MarineTheme.colors.bgSecondary,
      borderColor: MarineTheme.colors.border,
      textStyle: {
        color: MarineTheme.colors.textPrimary,
        fontSize: 12,
      },
    },
    legend: {
      data: ['선급 형식승인 기준치 (100점)', '현재 선박 설비 측정치'],
      textStyle: {
        color: MarineTheme.colors.textSecondary,
        fontSize: 11,
      },
      bottom: 5,
    },
    radar: {
      indicator: [
        { name: 'CEMS 센서 신뢰도', max: 100 },
        { name: '여과기 차압 여유도', max: 100 },
        { name: 'UV 램프 잔여수명', max: 100 },
        { name: '세정수 펌프 효율', max: 100 },
        { name: '중화제 제어 안정성', max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: MarineTheme.colors.textSecondary,
        fontSize: 11,
        fontWeight: 500,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(11, 19, 43, 0.4)', 'rgba(28, 37, 65, 0.4)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.15)',
        },
      },
    },
    series: [
      {
        name: '설비 건전성 진단',
        type: 'radar',
        data: [
          {
            value: [100, 100, 100, 100, 100],
            name: '선급 형식승인 기준치 (100점)',
            symbol: 'none',
            lineStyle: {
              type: 'dashed',
              color: 'rgba(255, 255, 255, 0.3)',
              width: 1.5,
            },
          },
          {
            value: [
              healthScore.cemsSensorReliability,
              healthScore.filterDpMargin,
              healthScore.uvLampLifespan,
              healthScore.pumpEfficiency,
              healthScore.neutralizerStability,
            ],
            name: '현재 선박 설비 측정치',
            itemStyle: {
              color: MarineTheme.colors.ecoCyan,
            },
            areaStyle: {
              color: 'rgba(0, 245, 212, 0.3)',
            },
            lineStyle: {
              color: MarineTheme.colors.ecoCyan,
              width: 2,
            },
          },
        ],
      },
    ],
  };

  return (
    <div
      className={`rounded-xl p-3 shadow-md bg-marine-card border border-marine-border ${className}`}
      data-testid="radar-chart-equipment-health"
    >
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-marine-secondary">
          Pan-Hawk 5-Axis Health Index
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-500/30">
          종합 평점: {healthScore.overallScore}점
        </span>
      </div>

      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
