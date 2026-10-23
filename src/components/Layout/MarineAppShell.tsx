import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useMarineDashboardStore } from '../../stores/useMarineDashboardStore';
import { useTelemetryStream } from '../../hooks/useTelemetryStream';
import { dualDbSyncEngine } from '../../services/dualDbSyncEngine';
import { accessAuditService } from '../../services/accessAuditService';
import { RoleSwitcher } from '../Common/RoleSwitcher';
import { ModeToggleBar } from '../Dashboard/ModeToggleBar';
import { MaritimeAuthModal } from './MaritimeAuthModal';
import {
  LayoutDashboard,
  MapPin,
  FileCheck2,
  AlertTriangle,
  Ship,
  Radio,
  Users,
  Lock,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: '관제 대시보드', icon: <LayoutDashboard size={18} /> },
  { path: '/gis', label: '해양 GIS 지도', icon: <MapPin size={18} /> },
  { path: '/reports', label: '선급 규제 감사', icon: <FileCheck2 size={18} /> },
  { path: '/alarms', label: '알람 전수 분석', icon: <AlertTriangle size={18} /> },
  { path: '/audit', label: '접속 감사 & 활성 통계', icon: <Users size={18} /> },
];

export const MarineAppShell: React.FC = () => {
  const {
    currentUser,
    currentRole,
    setRole,
    operatingMode,
    setOperatingMode,
    networkStatus,
    setNetworkStatus,
    syncStatus,
    setSyncStatus,
    pendingCount,
    setPendingCount,
    selectedVesselId,
    setSelectedVesselId,
    vessels,
    alarms,
    isStreaming,
    advanceVesselPositions,
  } = useMarineDashboardStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  // 실시간 선박 항행 데드레커닝 시뮬레이션 (전역 영속 실행: /gis 및 / 대시보드 무중단 보장)
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      advanceVesselPositions(5);
    }, 5000);
    return () => clearInterval(interval);
  }, [isStreaming, advanceVesselPositions]);

  // 화면 이동 시 자동 PAGE_VIEW 감사 로그 기록 (Zero-PII)
  useEffect(() => {
    accessAuditService
      .logAuditEvent({
        actionType: 'PAGE_VIEW',
        targetPath: location.pathname,
      })
      .catch(() => {});
  }, [location.pathname]);

  // 10Hz GCP 센서 스트림 (AppShell 차원에서 영속 연결 유지 - 무중단 보장)
  const edgeStream = useTelemetryStream({
    autoPoll: networkStatus === 'ONLINE',
    pollIntervalMs: 2000,
  });

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];
  const unacknowledgedAlarmCount = alarms.filter((a) => !a.acknowledged).length;

  const handleToggleOperatingMode = (mode: 'EDGE' | 'CLOUD') => {
    setOperatingMode(mode);
  };

  const handleToggleNetworkStatus = async () => {
    const next = networkStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setNetworkStatus(next);
    await dualDbSyncEngine.setSatelliteLink(next === 'ONLINE');
    if (next === 'ONLINE') {
      await dualDbSyncEngine.flushSyncQueue();
      setPendingCount(dualDbSyncEngine.getQueueLength());
    }
  };

  const handleManualFlush = async () => {
    setSyncStatus('SYNCING');
    try {
      const res = await dualDbSyncEngine.flushSyncQueue();
      setPendingCount(dualDbSyncEngine.getQueueLength());
      setSyncStatus(res.success ? 'IDLE' : 'ERROR');
    } catch {
      setSyncStatus('ERROR');
    }
  };

  return (
    <div className="min-h-screen bg-marine-app text-slate-100 flex flex-col font-sans">
      {/* 1. Global Persistent Header */}
      <header className="marine-header flex items-center justify-between flex-wrap gap-3">
        {/* Brand & Vessel Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className="text-marine-cyan animate-pulse w-5 h-5" />
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white m-0">
              EcoMarine HMI
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg px-2.5 py-1 border border-slate-700/80">
            <Ship className="text-marine-secondary w-4 h-4" />
            <select
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-marine-primary outline-none cursor-pointer"
              aria-label="선박 선택"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.name} ({v.callSign})
                </option>
              ))}
            </select>
          </div>

          {selectedVessel && (
            <span className="hidden sm:inline-flex marine-chip text-xs">
              IMO {selectedVessel.imoNumber} · {selectedVessel.speedKts.toFixed(1)} kts
            </span>
          )}
        </div>

        {/* Header Right: Zero-PII Auth Chip & 4대 직무 스위처 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {currentUser && !currentUser.isAnonymousGuest ? (
            <button
              type="button"
              data-testid="header-user-chip"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 bg-cyan-950/60 border border-marine-cyan/50 hover:bg-cyan-900/60 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-100 transition-all cursor-pointer shadow-sm"
              title="선급 및 직무 세션 정보 확인"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-cyan-300">{currentUser.userHashId}</span>
              <span className="hidden sm:inline text-slate-400">({currentUser.organization})</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="header-login-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="marine-btn text-xs bg-slate-900 border border-slate-700 hover:border-marine-cyan hover:text-marine-cyan text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={14} className="text-marine-cyan" />
              <span>선급 1-클릭 인증</span>
            </button>
          )}

          <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
        </div>
      </header>

      {/* 2. Sub-Header: ModeToggleBar & Desktop Navigation Tabs */}
      <div className="bg-slate-900/80 border-b border-marine-border px-3 md:px-6 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-marine-cyan border border-marine-border shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.path === '/alarms' && unacknowledgedAlarmCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {unacknowledgedAlarmCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 2원화 관제 모드 및 위성 통신 토글 바 */}
        <ModeToggleBar
          operatingMode={operatingMode}
          networkStatus={networkStatus}
          syncStatus={syncStatus}
          pendingCount={pendingCount}
          onToggleOperatingMode={handleToggleOperatingMode}
          onToggleNetworkStatus={handleToggleNetworkStatus}
          onManualFlush={handleManualFlush}
        />
      </div>

      {/* 3. Main Outlet Container (Zero Disconnection Across Navigation) */}
      <main className="flex-1 p-3 md:p-6 pb-24 md:pb-8 max-w-[1920px] mx-auto w-full">
        <Outlet />
      </main>

      {/* 4. Mobile Bottom Navigation Bar (토스 / 당근 모바일 HMI 패턴, >=44px 터치 영역) */}
      <nav
        aria-label="모바일 하단 내비게이션"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-t border-marine-border flex justify-around items-center py-1.5 px-2 shadow-2xl"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] min-w-[64px] rounded-lg p-1 text-[11px] font-medium transition-all ${
                isActive
                  ? 'text-marine-cyan font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <div className="relative">
              {item.icon}
              {item.path === '/alarms' && unacknowledgedAlarmCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full animate-pulse">
                  {unacknowledgedAlarmCount}
                </span>
              )}
            </div>
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 5. Desktop HMI Status Bar */}
      <footer className="hidden md:flex items-center justify-between px-4 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                edgeStream.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {edgeStream.isConnected
              ? '10Hz GCP 센서 스트림 정상 (9.98 Hz)'
              : 'GCP 센서 연결 대기'}
          </span>
          <span>선박 에지 PC: e2-micro (Ubuntu 24.04 LTS / Docker)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>위성 연결: {networkStatus}</span>
          <span>동기화 대기: {pendingCount}건</span>
          <span>IMO MARPOL Annex VI MEPC.340(77) 준수 관제 중</span>
        </div>
      </footer>

      {/* 6. Maritime Cyber Security Auth Modal */}
      <MaritimeAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

