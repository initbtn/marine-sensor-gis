/**
 * 해양 사이버 보안 및 선급(IACS UR E26/E27) 표준 인증 & Zero-PII 감사 인터페이스
 * IMO MSC.428(98), GDPR / 개인정보보호법 Zero-PII 원칙 준수
 */

import { UserRole } from './telemetry';

export type MaritimeOrganization =
  | 'KR'            // 한국선급 (Korean Register)
  | 'DNV'           // 노르웨이선급 (Det Norske Veritas)
  | 'ABS'           // 미국선급 (American Bureau of Shipping)
  | 'PANASIA'       // 파나시아 본사 및 현장 엔지니어링
  | 'FLEET_OWNER'   // 선사/육상 선단 운항사
  | 'PUBLIC';       // 공개 방문자

export type AuditActionType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'PAGE_VIEW'
  | 'BYPASS_TOGGLE'
  | 'ALARM_ACK'
  | 'MODE_TOGGLE'
  | 'ROLE_SWITCH'
  | 'REPORT_DOWNLOAD'
  | 'VESSEL_SELECT';

export interface MaritimeUser {
  userHashId: string;       // 비가역 단방향 솔트 해시 식별자 (usr_ + 10 hex)
  role: UserRole;
  organization: MaritimeOrganization;
  organizationName: string; // 표출용 국문 명칭
  title: string;            // 직책/인증 명칭 (예: 선급 수석 감사관)
  issuedAt: string;         // 세션 발급 시각 (ISO 8601)
  isAnonymousGuest: boolean;
}

export interface AccessAuditLog {
  id: string;
  userHashId: string;
  assignedRole: UserRole;
  organization: MaritimeOrganization;
  actionType: AuditActionType;
  targetPath: string;
  sessionDurationSec: number;
  createdAt: string;
}

export interface ActiveUserStats {
  activeNowCount: number;      // 최근 5분 내 실시간 동시 접속자 수
  dauCount: number;            // 당일 누적 고유 활성 사용자 수 (DAU)
  totalActionsToday: number;   // 당일 발생한 전체 시스템 조작 이벤트 수
  roleBreakdown: Record<string, number>; // 직무별 활성 분포
}
