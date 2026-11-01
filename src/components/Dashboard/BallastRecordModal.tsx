import React, { useState } from 'react';
import { BallastOperationType } from '../../types/ballast';
import { ballastRecordService } from '../../services/ballastRecordService';
import { Droplets, CheckCircle2, AlertTriangle, Download, X, Search } from 'lucide-react';

interface BallastRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVesselId?: string;
  selectedVesselName?: string;
}

export const BallastRecordModal: React.FC<BallastRecordModalProps> = ({
  isOpen,
  onClose,
  selectedVesselId,
  selectedVesselName,
}) => {
  const [filterType, setFilterType] = useState<BallastOperationType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const records = ballastRecordService.getRecords({
    operationType: filterType,
    vesselId: selectedVesselId,
    tankName: searchTerm ? searchTerm : undefined,
  });

  const stats = ballastRecordService.getSummaryStats(selectedVesselId);

  const handleExportCsv = () => {
    const headers = [
      'Record ID',
      'Vessel Name',
      'Operation Type',
      'Start Time (UTC)',
      'Completed Time (UTC)',
      'Location',
      'Coordinates',
      'Tank Name',
      'Volume (m3)',
      'Flow Rate (m3/h)',
      'TRO (ppm)',
      'Status',
      'Operator',
    ];

    const rows = records.map((r) => [
      r.recordId,
      r.vesselName,
      r.operationType,
      r.startedAt,
      r.completedAt,
      `"${r.locationName}"`,
      `"${r.latitude}, ${r.longitude}"`,
      r.tankName,
      r.volumeM3,
      r.flowRateM3h,
      r.troPpm,
      r.status,
      r.operatorId,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BWRB_${selectedVesselId || 'ALL'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="ballast-record-modal"
    >
      <div className="bg-slate-900 border border-marine-border rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 상단 헤더 */}
        <div className="px-5 py-4 border-b border-marine-border/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                IMO BWM 선박평형수관리기록부 (Electronic BWRB)
                {selectedVesselName && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                    {selectedVesselName}
                  </span>
                )}
              </h2>
              <p className="text-xs text-marine-secondary mt-0.5">
                파나시아 GloEn-Patrol™ 전기분해/자외선 살균 처리 및 주입·배출 수명주기 감사 기록
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            data-testid="btn-close-ballast-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 법정 요약 지표 통계 바 */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-marine-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-marine-border/40">
            <span className="text-marine-secondary block text-[11px]">총 주입량 (Uptake)</span>
            <span className="text-base font-mono font-bold text-blue-400">
              {stats.totalUptakeVolumeM3.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³</span>
            </span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-marine-border/40">
            <span className="text-marine-secondary block text-[11px]">총 배출량 (Discharge)</span>
            <span className="text-base font-mono font-bold text-emerald-400">
              {stats.totalDischargeVolumeM3.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³</span>
            </span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-marine-border/40">
            <span className="text-marine-secondary block text-[11px]">평균 TRO 소독 농도</span>
            <span className="text-base font-mono font-bold text-cyan-300">
              {stats.averageTroPpm} <span className="text-xs font-normal text-slate-400">ppm (&lt; 0.2)</span>
            </span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-marine-border/40">
            <span className="text-marine-secondary block text-[11px]">선급 규제 준수율</span>
            <span className="text-base font-mono font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {stats.complianceRatePercent}%
            </span>
          </div>
        </div>

        {/* 필터 및 검색 컨트롤러 */}
        <div className="px-5 py-3 border-b border-marine-border/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'UPTAKE', 'DISCHARGE', 'CIRCULATION'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {type === 'ALL'
                  ? '전체'
                  : type === 'UPTAKE'
                  ? '⬇ 주입/보충'
                  : type === 'DISCHARGE'
                  ? '⬆ 배출'
                  : '🔄 순환소독'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="탱크명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-marine-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-48"
              />
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-marine-border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="CSV 형식으로 선급 제출용 데이터 내보내기"
              data-testid="btn-export-csv"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* 테이블 목록 */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="overflow-x-auto rounded-lg border border-marine-border/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-marine-secondary font-semibold border-b border-marine-border/80">
                <tr>
                  <th className="px-3 py-2.5">기록 ID</th>
                  <th className="px-3 py-2.5">구분</th>
                  <th className="px-3 py-2.5">작업 위치 및 항만</th>
                  <th className="px-3 py-2.5">탱크명</th>
                  <th className="px-3 py-2.5 text-right">수량 (m³)</th>
                  <th className="px-3 py-2.5 text-right">유속 (m³/h)</th>
                  <th className="px-3 py-2.5 text-right">TRO 농도</th>
                  <th className="px-3 py-2.5 text-center">준수 상태</th>
                  <th className="px-3 py-2.5 text-center">완료 시각 (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-marine-border/40">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">
                      해당 조건의 평형수 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const isUptake = r.operationType === 'UPTAKE';
                    const isDischarge = r.operationType === 'DISCHARGE';
                    return (
                      <tr key={r.recordId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2 font-mono font-semibold text-white">{r.recordId}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isUptake
                                ? 'bg-blue-900/60 text-blue-300 border border-blue-500/40'
                                : isDischarge
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {isUptake ? '⬇ 주입' : isDischarge ? '⬆ 배출' : '🔄 순환'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-200">{r.locationName}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {r.latitude.toFixed(3)}°N, {r.longitude.toFixed(3)}°E
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-300 font-medium">{r.tankName}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-white">
                          {r.volumeM3.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">{r.flowRateM3h}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={r.troPpm < 0.2 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                            {r.troPpm} ppm
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'COMPLIANT'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {r.status === 'COMPLIANT' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 적합
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-400" /> 초과
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-400">
                          {new Date(r.completedAt).toISOString().replace('T', ' ').slice(0, 16)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모달 하단 닫기 바 */}
        <div className="px-5 py-3 border-t border-marine-border/80 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            * IMO BWM Convention Regulation B-2 준수: 최소 2년간 선내 상시 보존 의무 문서
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
