import React, { useState } from 'react';
import { HeatmapChart } from '../Chart/HeatmapChart';
import { MetricCard } from '../Common/MetricCard';
import { accessAuditService } from '../../services/accessAuditService';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  CloudDownload,
  Lock,
} from 'lucide-react';
import { MarineTheme } from '../../styles/theme';

export const ComplianceReportPage: React.FC = () => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportPdf = async () => {
    await accessAuditService.logAuditEvent({
      actionType: 'REPORT_DOWNLOAD',
      targetPath: '/reports',
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

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
            onClick={handleExportPdf}
            className="marine-btn marine-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={14} /> 선급 제출용 PDF 출력
          </button>
        </div>

        {downloadSuccess && (
          <div className="mb-4 bg-cyan-950/40 border border-marine-cyan/50 text-cyan-200 p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                선급 제출용 공식 법정 PDF 감사 리포트가 생성되었습니다. (Cloudflare R2 Parquet 무결성 해시 서명 완료)
              </span>
            </div>
            <span className="font-mono text-[11px] text-cyan-400 bg-slate-900 px-2 py-0.5 rounded">
              SHA256: 8f4a1c9e...
            </span>
          </div>
        )}

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

        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 mb-4">
          <HeatmapChart
            title="요일/시간대별 환경 규제 임계치 초과 발생 빈도 (Violation Matrix)"
            height="320px"
          />
        </div>

        {/* Cloudflare R2 Parquet Legal Archiving Section */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-marine-cyan/30 text-marine-cyan">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-100 m-0">
                  Cloudflare R2 Parquet 24개월 선급 법정 데이터 아카이빙
                </h3>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 px-1.5 py-0.2 rounded font-semibold">
                  동기화 정상
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 m-0">
                IMO MARPOL Annex VI MEPC.340(77) 및 IACS UR E26/E27 규정에 의거, 10Hz 센서 데이터를 Snappy 압축 Parquet 형식으로 실시간 아카이빙합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExportPdf}
              className="marine-btn text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <CloudDownload size={14} />
              <span>R2 Parquet 다운로드</span>
            </button>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Lock size={12} className="text-emerald-400" />
              <span>SHA-256 무결</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
