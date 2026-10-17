import React from 'react';
import ReactECharts from 'echarts-for-react';
import { MarineTheme } from '../../styles/theme';

interface HeatmapChartProps {
  data?: Array<[number, number, number]>; // [hourIndex, dayIndex, count]
  title?: string;
  height?: string;
  className?: string;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  title = '요일/시간대별 환경 규제 임계치 초과 발생 빈도 (Violation Matrix)',
  height = '280px',
  className = '',
}) => {
  const hours = [
    '00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22',
  ];
  const days = ['일', '토', '금', '목', '수', '화', '월'];

  // 기본 더미 데이터 (주요 이상 패턴: 입항 시간대인 오전 06~08시에 미세 상승 모의)
  const defaultData: Array<[number, number, number]> = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 12; h++) {
      let val = 0;
      if (h === 3 || h === 4) {
        val = d % 3 === 0 ? 3 : 1; // 06시, 08시 입항 전 피크
      } else if (d === 2 && h === 8) {
        val = 2;
      }
      defaultData.push([h, d, val]);
    }
  }

  const chartData = data || defaultData;

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: {
        color: MarineTheme.colors.textPrimary,
        fontSize: 13,
        fontWeight: 'bold',
      },
      top: 5,
      left: 10,
    },
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const item = params.data;
        return `${days[item[1]]}요일 ${hours[item[0]]}시: 위반/경보 ${item[2]}건`;
      },
      backgroundColor: MarineTheme.colors.bgSecondary,
      borderColor: MarineTheme.colors.border,
      textStyle: {
        color: MarineTheme.colors.textPrimary,
        fontSize: 12,
      },
    },
    grid: {
      top: 45,
      bottom: 25,
      left: 35,
      right: 50,
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: MarineTheme.colors.textSecondary,
        fontSize: 10,
      },
      axisLine: {
        lineStyle: {
          color: MarineTheme.colors.border,
        },
      },
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: MarineTheme.colors.textSecondary,
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: MarineTheme.colors.border,
        },
      },
    },
    visualMap: {
      min: 0,
      max: 4,
      calculable: false,
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: {
        color: MarineTheme.colors.textSecondary,
        fontSize: 10,
      },
      inRange: {
        color: [
          '#1E293B',                     // 0건: 기본 카드 배경
          'rgba(0, 245, 212, 0.4)',      // 1건: 정상/미미
          'rgba(255, 159, 28, 0.8)',     // 2건: 주의
          '#E71D36',                     // 3건 이상: 규제 초과
        ],
      },
    },
    series: [
      {
        name: '규제 위반 빈도',
        type: 'heatmap',
        data: chartData,
        label: {
          show: true,
          formatter: (p: any) => (p.data[2] > 0 ? p.data[2] : ''),
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 'bold',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <div
      className={`rounded-xl p-3 shadow-md ${className}`}
      style={{
        backgroundColor: MarineTheme.colors.bgCard,
        border: `1px solid ${MarineTheme.colors.border}`,
      }}
      data-testid="heatmap-chart-violation"
    >
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
