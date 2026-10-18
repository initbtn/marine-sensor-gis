import React from 'react';
import { HeatmapChart } from '../Chart/HeatmapChart';
import { MetricCard } from '../Common/MetricCard';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MarineTheme } from '../../styles/theme';

export const ComplianceReportPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 text-slate-100" data-testid="compliance-report-page">
      <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-marine-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <h2 className="text-base font-bold text-marine-primary">
              선급 및 IMO MARPOL Annex VI / BWM D-2 법정 규제 준수 감사 보고서
            </h2>
          </div>
          <button
            type="button"
            onClick={() => alert('선급 제출용 공식 법정 PDF 감사 리포트가 생성되었습니다.')}
            className="marine-btn marine-btn-primary text-xs"
          >
            <FileText size={14} /> 선급 제출용 PDF 출력
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <MetricCard
            title="당월 누적 규제 준수율"
            value={99.8}
            unit="%"
            status="INFO"
            icon={<CheckCircle2 size={16} />}
            thresholdNotice={`선급 목표 ${MarineTheme.thresholds.complianceRateTargetPct}% 이상`}
            subtext="KR / DNV 선급 기준 충족"
          />
          <MetricCard
            title="ECA 배출규제해역 진입 이력"
            value={14}
            unit="회"
            status="INFO"
            icon={<ShieldCheck size={16} />}
            thresholdNotice="SOx <= 4.3 ppm 기준 항해"
            subtext="북해 / 발트해 ECA 구간"
          />
          <MetricCard
            title="임계치 초과 주의 이벤트"
            value={2}
            unit="건"
            status="WARNING"
            icon={<AlertTriangle size={16} />}
            thresholdNotice="자체 조치 완료"
            subtext="입항 가감속 구간 미세초과"
          />
        </div>

        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
          <HeatmapChart
            title="요일/시간대별 환경 규제 임계치 초과 발생 빈도 (Violation Matrix)"
            height="320px"
          />
        </div>
      </div>
    </div>
  );
};
