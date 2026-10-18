import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';

export type OperatingMode = 'EDGE' | 'CLOUD';
export type NetworkStatus = 'ONLINE' | 'OFFLINE';
export type SyncState = 'IDLE' | 'SYNCING' | 'ERROR';

export interface ModeToggleBarProps {
  operatingMode: OperatingMode;
  networkStatus: NetworkStatus;
  syncStatus: SyncState;
  pendingCount: number;
  onToggleOperatingMode: (mode: OperatingMode) => void;
  onToggleNetworkStatus: () => void;
  onManualFlush: () => void;
  className?: string;
}

export const ModeToggleBar: React.FC<ModeToggleBarProps> = ({
  operatingMode,
  networkStatus,
  syncStatus,
  pendingCount,
  onToggleOperatingMode,
  onToggleNetworkStatus,
  onManualFlush,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between flex-wrap gap-3 bg-slate-900/90 p-2.5 md:px-4 rounded-lg border border-slate-800 text-slate-100 ${className}`}
    >
      {/* 1. 선박 에지 ⇄ 내륙 클라우드 2원화 모드 토글 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">
          관제 모드:
        </span>
        <div className="inline-flex rounded-md bg-slate-800 p-0.5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => onToggleOperatingMode('EDGE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded min-h-[38px] transition-all cursor-pointer ${
              operatingMode === 'EDGE'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚢 선박 로컬 에지
          </button>
          <button
            type="button"
            onClick={() => onToggleOperatingMode('CLOUD')}
            className={`px-3 py-1.5 text-xs font-semibold rounded min-h-[38px] transition-all cursor-pointer ${
              operatingMode === 'CLOUD'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏢 내륙 클라우드
          </button>
        </div>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
            operatingMode === 'EDGE'
              ? 'text-sky-400 bg-sky-950/40 border-sky-500/30'
              : 'text-teal-400 bg-teal-950/40 border-teal-500/30'
          }`}
        >
          {operatingMode === 'EDGE' ? '0ms 무지연 10Hz Raw 센서' : '1분/1시간 통계 집계 & 규제 이력'}
        </span>
      </div>

      {/* 2. 위성 통신 시뮬레이터 & 동기화 큐 인디케이터 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 위성 네트워크 상태 토글 */}
        <button
          type="button"
          data-testid="network-toggle-btn"
          onClick={onToggleNetworkStatus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold min-h-[38px] border transition-all cursor-pointer ${
            networkStatus === 'ONLINE'
              ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50'
              : 'border-rose-500/60 bg-rose-950/30 text-rose-400 hover:bg-rose-950/50'
          }`}
        >
          {networkStatus === 'ONLINE' ? (
            <>
              <Wifi size={14} /> 위성 링크 정상 (Online)
            </>
          ) : (
            <>
              <WifiOff size={14} /> 위성 링크 단절 (Offline)
            </>
          )}
        </button>

        {/* Store-and-Forward 대기 큐 인디케이터 */}
        <div className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
          <Database size={14} className="text-slate-400" />
          <span className="text-slate-400">대기 큐:</span>
          <span
            className={`font-bold px-1.5 py-0.5 rounded-full text-[11px] border ${
              pendingCount > 0
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
            }`}
          >
            {pendingCount}건 대기
          </span>
        </div>

        {/* 수동 동기화 트리거 */}
        <button
          type="button"
          onClick={onManualFlush}
          disabled={syncStatus === 'SYNCING' || networkStatus === 'OFFLINE'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold min-h-[38px] border border-sky-600 bg-sky-600 hover:bg-sky-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={13} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
          {syncStatus === 'SYNCING' ? '동기화 중...' : '즉시 동기화 (Flush)'}
        </button>
      </div>
    </div>
  );
};
