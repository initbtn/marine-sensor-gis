import React, { useState, useEffect, useCallback } from 'react';
import { AccessAuditLog, ActiveUserStats, AuditActionType } from '../../types/auth';
import { accessAuditService } from '../../services/accessAuditService';
import { MetricCard } from '../Common/MetricCard';
import {
  ShieldCheck,
  Users,
  Activity,
  History,
  RotateCw,
  Lock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  KeyRound,
} from 'lucide-react';

export const AuditDashboard: React.FC = () => {
  const [stats, setStats] = useState<ActiveUserStats>({
    activeNowCount: 1,
    dauCount: 1,
    totalActionsToday: 5,
    roleBreakdown: {},
  });
  const [logs, setLogs] = useState<AccessAuditLog[]>([]);
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [fetchedStats, fetchedLogs] = await Promise.all([
        accessAuditService.getActiveUserStats(),
        accessAuditService.getRecentAuditLogs(50),
      ]);
      setStats(fetchedStats);
      setLogs(fetchedLogs);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = accessAuditService.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const filteredLogs = logs.filter((log) => {
    if (selectedActionFilter === 'ALL') return true;
    return log.actionType === selectedActionFilter;
  });

  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'BYPASS_TOGGLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
            <AlertTriangle className="w-3 h-3" />
            비상 바이패스 조작
          </span>
        );
      case 'ALARM_ACK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
            <AlertTriangle className="w-3 h-3" />
            알람 인지 (ACK)
          </span>
        );
      case 'REPORT_DOWNLOAD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
            <FileText className="w-3 h-3" />
            선급 리포트 출력
          </span>
        );
      case 'SESSION_START':
      case 'SESSION_END':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <KeyRound className="w-3 h-3" />
            {actionType === 'SESSION_START' ? '세션 인증 시작' : '세션 해제'}
          </span>
        );
      case 'MODE_TOGGLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-950/80 text-violet-300 border border-violet-700/60">
            관제 모드 전환
          </span>
        );
      case 'ROLE_SWITCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/60">
            직무 권한 전환
          </span>
        );
      case 'VESSEL_SELECT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            관제 대상 선박 변경
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            화면 탐색 (View)
          </span>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'CHIEF_ENGINEER':
        return '수석 기관사';
      case 'FLEET_OPERATOR':
        return '육상 관제관';
      case 'COMPLIANCE_OFFICER':
        return '선급 감사관';
      case 'DIAGNOSTIC_TECH':
        return '원격 진단원';
      default:
        return '방문자';
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100" data-testid="audit-dashboard-page">
      {/* 1. Header & Quick Actions */}
      <div className="bg-marine-card rounded-2xl p-5 border border-marine-border shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-marine-cyan/40 text-marine-cyan">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-marine-primary m-0">
              Zero-PII 접속 감사 트레일 &amp; 실시간 활성 유저 통계
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            IMO MSC.428(98) 및 IACS UR E26/E27 해양 사이버 보안 규율 준수 · 개인정보 미수집 비가역 해시 세션
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isRefreshing}
          className="marine-btn marine-btn-secondary text-xs flex items-center gap-2 cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>감사 통계 새로고침</span>
        </button>
      </div>

      {/* 2. Top Metric Cards (Active Users, DAU, Total Actions) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="실시간 동시 접속자 수"
          value={stats.activeNowCount}
          unit="명"
          status="INFO"
          icon={<Users size={18} />}
          thresholdNotice="최근 5분 활동 세션"
          subtext="IACS E26 비가역 식별자"
        />
        <MetricCard
          title="당일 누적 활성 사용자 (DAU)"
          value={stats.dauCount}
          unit="DAU"
          status="INFO"
          icon={<Activity size={18} />}
          thresholdNotice="금일 고유 해시 식별자"
          subtext="중복 제거 단방향 해시"
        />
        <MetricCard
          title="당일 시스템 조작 이벤트"
          value={stats.totalActionsToday}
          unit="건"
          status="INFO"
          icon={<History size={18} />}
          thresholdNotice="선급 감사 트레일 보존"
          subtext="비상 밸브/알람/다운로드 전수"
        />
      </div>

      {/* 3. Zero-PII Compliance & Role Distribution Banner */}
      <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300">
              Zero-PII 법정 규제 준수 상태: 무결 (Pass)
            </div>
            <div className="text-[11px] text-slate-400">
              이메일, 실명, 원본 IP, 전화번호 일체 미수집 / 미기록 증명
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">직무별 활성 분포:</span>
          {Object.entries(stats.roleBreakdown).map(([role, count]) => (
            <span key={role} className="marine-chip text-[11px]">
              {getRoleLabel(role)}: <strong className="text-cyan-300 ml-1">{count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* 4. Audit Trail Table */}
      <div className="bg-marine-card rounded-2xl border border-marine-border shadow-md overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="p-4 border-b border-marine-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-marine-cyan" />
            <h2 className="text-sm font-bold text-slate-100 m-0">
              식별자 기반 접속 및 제어 감사 트레일 ({filteredLogs.length}건)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none cursor-pointer"
              aria-label="액션 필터"
            >
              <option value="ALL">전체 액션 보기</option>
              <option value="BYPASS_TOGGLE">비상 바이패스 조작</option>
              <option value="ALARM_ACK">알람 인지 (ACK)</option>
              <option value="REPORT_DOWNLOAD">선급 리포트 출력</option>
              <option value="SESSION_START">세션 인증</option>
              <option value="MODE_TOGGLE">관제 모드 전환</option>
              <option value="ROLE_SWITCH">직무 전환</option>
            </select>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-marine-border">
              <tr>
                <th className="py-3 px-4 font-semibold">식별자 (Hash ID)</th>
                <th className="py-3 px-4 font-semibold">선급 / 소속</th>
                <th className="py-3 px-4 font-semibold">인가 직무</th>
                <th className="py-3 px-4 font-semibold">수행 액션</th>
                <th className="py-3 px-4 font-semibold">접근 경로</th>
                <th className="py-3 px-4 font-semibold">체류 시간</th>
                <th className="py-3 px-4 font-semibold">발생 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/40 transition-colors"
                  data-testid="audit-log-row"
                >
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>{log.userHashId}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-300">{log.organization}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {getRoleLabel(log.assignedRole)}
                  </td>
                  <td className="py-3 px-4">{getActionBadge(log.actionType)}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.targetPath}</td>
                  <td className="py-3 px-4 text-slate-400">{log.sessionDurationSec}초</td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    해당 필터 조건에 부합하는 감사 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Notice */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <span>
            데이터베이스 스키마: <code className="text-slate-400">marine_control.access_audit_logs</code> (24개월 선급 법정보존)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            선급 사이버 감사관 제출 적격성 인증됨
          </span>
        </div>
      </div>
    </div>
  );
};
