import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ScrubberTelemetry, BWTSTelemetry } from '../../types/telemetry';

interface TelemetryChartProps {
  facilityType: 'SCRUBBER' | 'BWTS';
  history: Array<{
    timestamp: string;
    scrubber: ScrubberTelemetry;
    bwts: BWTSTelemetry;
  }>;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ facilityType, history }) => {
  const times = history.map((h) => {
    const d = new Date(h.timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  });

  const getOption = () => {
    if (facilityType === 'SCRUBBER') {
      const soxData = history.map((h) => h.scrubber.soxPpm);
      const phData = history.map((h) => h.scrubber.phDischarge);

      return {
        title: {
          text: 'Scrubber 실시간 배기가스 SOx 및 배출 세정수 pH 모니터링',
          subtext: 'IMO MARPOL Annex VI 준수 감시 (SOx < 25 ppm, pH >= 6.5)',
          left: 'center',
          textStyle: { fontSize: 14, color: '#1e293b' },
          subtextStyle: { fontSize: 11, color: '#64748b' },
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['SOx 농도 (ppm)', '배출수 pH'],
          bottom: 0,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: times,
          boundaryGap: false,
        },
        yAxis: [
          {
            type: 'value',
            name: 'SOx (ppm)',
            min: 0,
            max: 30,
            axisLabel: { formatter: '{value} ppm' },
          },
          {
            type: 'value',
            name: 'pH',
            min: 5.5,
            max: 9.0,
            axisLabel: { formatter: '{value}' },
          },
        ],
        series: [
          {
            name: 'SOx 농도 (ppm)',
            type: 'line',
            smooth: true,
            data: soxData,
            yAxisIndex: 0,
            itemStyle: { color: '#ef4444' },
            markLine: {
              silent: true,
              data: [
                {
                  yAxis: 25,
                  name: 'SOx 배출 한도 (25 ppm)',
                  lineStyle: { color: '#b91c1c', type: 'dashed' },
                  label: { formatter: 'IMO Limit (25 ppm)' },
                },
              ],
            },
          },
          {
            name: '배출수 pH',
            type: 'line',
            smooth: true,
            data: phData,
            yAxisIndex: 1,
            itemStyle: { color: '#0ea5e9' },
            markLine: {
              silent: true,
              data: [
                {
                  yAxis: 6.5,
                  name: '최소 배출 pH (6.5)',
                  lineStyle: { color: '#0284c7', type: 'dashed' },
                  label: { formatter: 'Min pH (6.5)' },
                },
              ],
            },
          },
        ],
      };
    } else {
      // BWTS
      const flowData = history.map((h) => h.bwts.flowRateM3h);
      const troData = history.map((h) => h.bwts.troPpm);

      return {
        title: {
          text: 'BWTS 평형수 처리 유량 및 잔류 산화물(TRO) 시계열 관제',
          subtext: 'IMO D-2 / USCG 규정 준수 (TRO 잔류 농도 감시)',
          left: 'center',
          textStyle: { fontSize: 14, color: '#1e293b' },
          subtextStyle: { fontSize: 11, color: '#64748b' },
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['처리 유량 (m³/h)', 'TRO 농도 (ppm)'],
          bottom: 0,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: times,
          boundaryGap: false,
        },
        yAxis: [
          {
            type: 'value',
            name: '유량 (m³/h)',
            axisLabel: { formatter: '{value} m³/h' },
          },
          {
            type: 'value',
            name: 'TRO (ppm)',
            min: 0,
            max: 0.5,
            axisLabel: { formatter: '{value} ppm' },
          },
        ],
        series: [
          {
            name: '처리 유량 (m³/h)',
            type: 'bar',
            data: flowData,
            yAxisIndex: 0,
            itemStyle: { color: '#3b82f6' },
          },
          {
            name: 'TRO 농도 (ppm)',
            type: 'line',
            smooth: true,
            data: troData,
            yAxisIndex: 1,
            itemStyle: { color: '#10b981' },
            markLine: {
              silent: true,
              data: [
                {
                  yAxis: 0.2,
                  name: 'TRO 배출 한도 (0.2 ppm)',
                  lineStyle: { color: '#047857', type: 'dashed' },
                  label: { formatter: 'Max TRO (0.2 ppm)' },
                },
              ],
            },
          },
        ],
      };
    }
  };

  return (
    <div className="telemetry-chart" style={{ width: '100%', height: '360px' }} data-testid="telemetry-chart">
      <ReactECharts
        option={getOption()}
        style={{ height: '100%', width: '100%' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};
