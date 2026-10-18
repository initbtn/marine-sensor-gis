import React from 'react';
import ReactECharts from 'echarts-for-react';
import { MarineTheme } from '../../styles/theme';

interface GaugeChartProps {
  title: string;
  value: number;
  min?: number;
  max?: number;
  unit: string;
  thresholdValue?: number;
  thresholdLabel?: string;
  isEcaMode?: boolean;
  type?: 'SOX' | 'PH' | 'GENERIC';
  height?: string;
  className?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  value,
  min = 0,
  max = 30,
  unit,
  thresholdValue,
  thresholdLabel,
  isEcaMode = false,
  type = 'GENERIC',
  height = '240px',
  className = '',
}) => {
  // IMO 규정에 따른 게이지 컬러 밴드 분할 계산
  const getAxisLineColor = (): Array<[number, string]> => {
    if (type === 'SOX') {
      const limit = thresholdValue !== undefined ? thresholdValue : (isEcaMode ? 4.3 : 21.7);
      const warningStart = isEcaMode ? limit * 0.82 : 18.0;
      return [
        [warningStart / max, MarineTheme.colors.ecoCyan],
        [limit / max, MarineTheme.colors.warningAmber],
        [1, MarineTheme.colors.criticalCrimson],
      ];
    }
    if (type === 'PH') {
      // pH: 0~14, 4.0 미만 비상차단, 6.5 미만 경보, 6.5~8.5 정상
      return [
        [4.0 / 14, MarineTheme.colors.criticalCrimson],
        [6.5 / 14, MarineTheme.colors.warningAmber],
        [8.5 / 14, MarineTheme.colors.ecoCyan],
        [1, MarineTheme.colors.warningAmber],
      ];
    }
    return [
      [0.7, MarineTheme.colors.ecoCyan],
      [0.85, MarineTheme.colors.warningAmber],
      [1, MarineTheme.colors.criticalCrimson],
    ];
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: '{b} : {c}' + unit,
    },
    series: [
      {
        name: title,
        type: 'gauge',
        min: type === 'PH' ? 0 : min,
        max: type === 'PH' ? 14 : max,
        radius: '90%',
        center: ['50%', '55%'],
        startAngle: 210,
        endAngle: -30,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 14,
            color: getAxisLineColor(),
          },
        },
        pointer: {
          itemStyle: {
            color: MarineTheme.colors.textPrimary,
          },
          width: 4,
          length: '65%',
        },
        axisTick: {
          distance: -14,
          length: 6,
          lineStyle: {
            color: '#fff',
            width: 1,
          },
        },
        splitLine: {
          distance: -18,
          length: 12,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        axisLabel: {
          color: MarineTheme.colors.textSecondary,
          distance: 18,
          fontSize: 10,
        },
        detail: {
          valueAnimation: true,
          formatter: `{value} ${unit}`,
          color: MarineTheme.colors.textPrimary,
          fontSize: 16,
          fontWeight: 'bold',
          offsetCenter: [0, '70%'],
        },
        title: {
          offsetCenter: [0, '-25%'],
          fontSize: 12,
          color: MarineTheme.colors.textSecondary,
          fontWeight: 500,
        },
        data: [
          {
            value: Number(value.toFixed(2)),
            name: title,
          },
        ],
      },
    ],
  };

  return (
    <div
      className={`rounded-xl p-3 flex flex-col justify-between shadow-md bg-marine-card border border-marine-border ${className}`}
      data-testid={`gauge-chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-marine-primary">
          {title}
        </span>
        {thresholdLabel && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-500/30">
            {thresholdLabel}
          </span>
        )}
      </div>

      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
