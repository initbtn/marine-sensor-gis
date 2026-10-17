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
}

export const ModeToggleBar: React.FC<ModeToggleBarProps> = ({
  operatingMode,
  networkStatus,
  syncStatus,
  pendingCount,
  onToggleOperatingMode,
  onToggleNetworkStatus,
  onManualFlush,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#0f172a',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        color: '#f8fafc',
        marginBottom: '16px',
      }}
    >
      {/* 1. 선박 에지 ⇄ 내륙 클라우드 2원화 모드 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
          관제 모드:
        </span>
        <div
          style={{
            display: 'inline-flex',
            borderRadius: '6px',
            background: '#1e293b',
            padding: '3px',
          }}
        >
          <button
            type="button"
            onClick={() => onToggleOperatingMode('EDGE')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: operatingMode === 'EDGE' ? '#0284c7' : 'transparent',
              color: operatingMode === 'EDGE' ? '#ffffff' : '#94a3b8',
              transition: 'background 0.15s ease',
            }}
          >
            🚢 선박 로컬 에지
          </button>
          <button
            type="button"
            onClick={() => onToggleOperatingMode('CLOUD')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: operatingMode === 'CLOUD' ? '#0d9488' : 'transparent',
              color: operatingMode === 'CLOUD' ? '#ffffff' : '#94a3b8',
              transition: 'background 0.15s ease',
            }}
          >
            🏢 내륙 클라우드
          </button>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: operatingMode === 'EDGE' ? '#38bdf8' : '#2dd4bf',
            background: operatingMode === 'EDGE' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(13, 148, 136, 0.15)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${operatingMode === 'EDGE' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(45, 212, 191, 0.3)'}`,
          }}
        >
          {operatingMode === 'EDGE' ? '0ms 무지연 10Hz Raw 센서' : '1분/1시간 통계 집계 & 규제 이력'}
        </span>
      </div>

      {/* 2. 위성 통신 시뮬레이터 & 동기화 큐 인디케이터 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 위성 네트워크 상태 토글 */}
        <button
          type="button"
          data-testid="network-toggle-btn"
          onClick={onToggleNetworkStatus}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            border: `1px solid ${networkStatus === 'ONLINE' ? '#16a34a' : '#dc2626'}`,
            background: networkStatus === 'ONLINE' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
            color: networkStatus === 'ONLINE' ? '#4ade80' : '#f87171',
            cursor: 'pointer',
          }}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            background: '#1e293b',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
          }}
        >
          <Database size={14} color="#94a3b8" />
          <span style={{ color: '#94a3b8' }}>대기 큐:</span>
          <span
            style={{
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '11px',
              background: pendingCount > 0 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(148, 163, 184, 0.2)',
              color: pendingCount > 0 ? '#facc15' : '#94a3b8',
              border: `1px solid ${pendingCount > 0 ? 'rgba(250, 204, 21, 0.4)' : '#475569'}`,
            }}
          >
            {pendingCount}건 대기
          </span>
        </div>

        {/* 수동 동기화 트리거 */}
        <button
          type="button"
          onClick={onManualFlush}
          disabled={syncStatus === 'SYNCING' || networkStatus === 'OFFLINE'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            border: '1px solid #0284c7',
            background: syncStatus === 'SYNCING' ? '#0369a1' : '#0284c7',
            color: '#ffffff',
            cursor: syncStatus === 'SYNCING' || networkStatus === 'OFFLINE' ? 'not-allowed' : 'pointer',
            opacity: syncStatus === 'SYNCING' || networkStatus === 'OFFLINE' ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} />
          {syncStatus === 'SYNCING' ? '동기화 중...' : '즉시 동기화 (Flush)'}
        </button>
      </div>
    </div>
  );
};
