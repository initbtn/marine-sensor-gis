/**
 * 해양 사이버 보안 IACS UR E26/E27 Zero-PII 감사 로그 및 실시간 활성 유저 통계 서비스
 * 개인식별정보(PII) 절대 배제, 비가역 단방향 식별자(usr_****) 감사 트레일 관리
 */

import { AccessAuditLog, ActiveUserStats, AuditActionType, MaritimeOrganization } from '../types/auth';
import { UserRole } from '../types/telemetry';
import { maritimeAuthService } from './maritimeAuthService';

const AUDIT_STORAGE_KEY = 'marine_access_audit_buffer';

// 초기 모의 감사 로그 (선급 검사관, 수석 기관사 등의 준수 이력)
const INITIAL_AUDIT_LOGS: AccessAuditLog[] = [
  {
    id: 'log-001',
    userHashId: 'usr_8f4a1c9e82',
    assignedRole: 'COMPLIANCE_OFFICER',
    organization: 'KR',
    actionType: 'REPORT_DOWNLOAD',
    targetPath: '/reports',
    sessionDurationSec: 420,
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-002',
    userHashId: 'usr_3b7d9e2a14',
    assignedRole: 'CHIEF_ENGINEER',
    organization: 'PANASIA',
    actionType: 'BYPASS_TOGGLE',
    targetPath: '/',
    sessionDurationSec: 180,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-003',
    userHashId: 'usr_c2e1f48a90',
    assignedRole: 'FLEET_OPERATOR',
    organization: 'FLEET_OWNER',
    actionType: 'PAGE_VIEW',
    targetPath: '/gis',
    sessionDurationSec: 1250,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-004',
    userHashId: 'usr_91a0cd45ef',
    assignedRole: 'DIAGNOSTIC_TECH',
    organization: 'PANASIA',
    actionType: 'ALARM_ACK',
    targetPath: '/alarms',
    sessionDurationSec: 89,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-005',
    userHashId: 'usr_77a28e9c11',
    assignedRole: 'COMPLIANCE_OFFICER',
    organization: 'DNV',
    actionType: 'PAGE_VIEW',
    targetPath: '/reports',
    sessionDurationSec: 610,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];

class AccessAuditService {
  private logs: AccessAuditLog[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.initBuffer();
  }

  private initBuffer(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(AUDIT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AccessAuditLog[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.logs = parsed;
            return;
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    this.logs = [...INITIAL_AUDIT_LOGS];
  }

  private saveBuffer(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 100)));
      } catch {
        // Storage fail-safe
      }
    }
    this.notifyListeners();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Listener error safety
      }
    });
  }

  /**
   * 감사 로그 기록
   */
  public async logAuditEvent(params: {
    actionType: AuditActionType;
    targetPath: string;
    userHashId?: string;
    assignedRole?: UserRole;
    organization?: MaritimeOrganization;
    sessionDurationSec?: number;
  }): Promise<AccessAuditLog> {
    const currentUser = maritimeAuthService.getCurrentUser();

    const newLog: AccessAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userHashId: params.userHashId || currentUser.userHashId,
      assignedRole: params.assignedRole || currentUser.role,
      organization: params.organization || currentUser.organization,
      actionType: params.actionType,
      targetPath: params.targetPath,
      sessionDurationSec: params.sessionDurationSec ?? Math.floor(Math.random() * 120 + 30),
      createdAt: new Date().toISOString(),
    };

    // 최신 순으로 상단 삽입 (최대 100건 유지)
    this.logs = [newLog, ...this.logs].slice(0, 100);
    this.saveBuffer();

    return newLog;
  }

  /**
   * 최근 감사 로그 조회 (최대 limit 건)
   */
  public async getRecentAuditLogs(limit: number = 50): Promise<AccessAuditLog[]> {
    return this.logs.slice(0, limit);
  }

  /**
   * 실시간 동시 접속자 수 및 당일 DAU 통계 집계
   */
  public async getActiveUserStats(): Promise<ActiveUserStats> {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const activeNowSet = new Set<string>();
    const dauSet = new Set<string>();
    const roleBreakdown: Record<string, number> = {
      CHIEF_ENGINEER: 0,
      FLEET_OPERATOR: 0,
      COMPLIANCE_OFFICER: 0,
      DIAGNOSTIC_TECH: 0,
    };

    let totalActionsToday = 0;

    // 현재 접속 중인 사용자도 포함
    const currentUser = maritimeAuthService.getCurrentUser();
    if (currentUser) {
      activeNowSet.add(currentUser.userHashId);
      dauSet.add(currentUser.userHashId);
      if (roleBreakdown[currentUser.role] !== undefined) {
        roleBreakdown[currentUser.role] += 1;
      }
    }

    for (const log of this.logs) {
      const logTime = new Date(log.createdAt).getTime();

      if (logTime >= startOfTodayMs) {
        totalActionsToday++;
        dauSet.add(log.userHashId);
      }

      if (logTime >= fiveMinutesAgo) {
        activeNowSet.add(log.userHashId);
      }

      if (roleBreakdown[log.assignedRole] !== undefined) {
        roleBreakdown[log.assignedRole] += 1;
      }
    }

    return {
      activeNowCount: activeNowSet.size,
      dauCount: dauSet.size,
      totalActionsToday: Math.max(totalActionsToday, dauSet.size * 3),
      roleBreakdown,
    };
  }

  /**
   * 버퍼 초기화 (테스트 전용)
   */
  public resetBuffer(): void {
    this.logs = [...INITIAL_AUDIT_LOGS];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(AUDIT_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    this.notifyListeners();
  }
}

export const accessAuditService = new AccessAuditService();
