/**
 * 해양 IACS UR E26/E27 및 선급 표준 Zero-PII 인증 서비스
 * 이메일, 실명, 전화번호, 원본 IP 수집을 일체 배제하며,
 * 비가역 단방향 솔트 해시 식별자(usr_****) 세션만을 발급합니다.
 */

import { sha256 } from 'js-sha256';
import { MaritimeUser, MaritimeOrganization } from '../types/auth';
import { UserRole } from '../types/telemetry';

const SALT_PREFIX = 'marine-salt-iacs-e27-v1-';
const STORAGE_KEY = 'marine_zero_pii_session';

export interface MaritimePreset {
  id: string;
  name: string;
  role: UserRole;
  organization: MaritimeOrganization;
  organizationName: string;
  title: string;
  description: string;
  iconType: 'shield' | 'anchor' | 'wrench' | 'monitor' | 'cpu' | 'user';
}

export const MARITIME_PRESETS: MaritimePreset[] = [
  {
    id: 'KR_SURVEYOR',
    name: '한국선급 (KR) 공인 감사관',
    role: 'COMPLIANCE_OFFICER',
    organization: 'KR',
    organizationName: '한국선급 (KR)',
    title: 'KR 사이버보안 공인 감사관',
    description: 'IACS UR E26/E27 및 IMO MARPOL 환경 규제 준수 여부 법적 검사',
    iconType: 'shield',
  },
  {
    id: 'DNV_SURVEYOR',
    name: '노르웨이선급 (DNV) 사이버인증 검사관',
    role: 'COMPLIANCE_OFFICER',
    organization: 'DNV',
    organizationName: '노르웨이선급 (DNV)',
    title: 'DNV 선급 사이버보안 검사관',
    description: '선박 OT 네트워크 및 CEMS/BWTS 환경 계측 무결성 정기 심사',
    iconType: 'anchor',
  },
  {
    id: 'CHIEF_ENGINEER',
    name: '파나시아 수석 선박 기관사',
    role: 'CHIEF_ENGINEER',
    organization: 'PANASIA',
    organizationName: '파나시아 친환경설비팀',
    title: '수석 기관사 (Chief Engineer)',
    description: '선박 현장 스크러버/BWTS 가동 제어 및 비상 바이패스 운전',
    iconType: 'wrench',
  },
  {
    id: 'FLEET_OPERATOR',
    name: '육상 통합관제 센터장',
    role: 'FLEET_OPERATOR',
    organization: 'FLEET_OWNER',
    organizationName: '글로벌 선단관제센터',
    title: '원격 관제팀장 (Fleet Operator)',
    description: '전 세계 선단 실시간 텔레메트리 모니터링 및 위성 동기화 감시',
    iconType: 'monitor',
  },
  {
    id: 'DIAGNOSTIC_TECH',
    name: 'Pan-Hawk 원격 진단원',
    role: 'DIAGNOSTIC_TECH',
    organization: 'PANASIA',
    organizationName: '파나시아 Pan-Hawk',
    title: '원격 고장진단 기술원',
    description: 'CEMS 센서 드리프트 분석, 배기가스 비율 정밀 진단 및 펌프 상태 분석',
    iconType: 'cpu',
  },
  {
    id: 'GUEST',
    name: '익명 게스트 탐색자',
    role: 'COMPLIANCE_OFFICER',
    organization: 'PUBLIC',
    organizationName: '공개 탐색 (Zero-PII)',
    title: '일반 방문자',
    description: '무인증 Zero-Friction 공개 관제 대시보드 둘러보기',
    iconType: 'user',
  },
];

class MaritimeAuthService {
  private currentUser: MaritimeUser | null = null;

  /**
   * PII(이름, 이메일 등) 없이 고유 시드로부터 비가역 단방향 해시 식별자를 생성합니다.
   * 식별자 형식: usr_ + 10자리 16진수 소문자
   */
  public generateAnonymousUserId(seed: string): string {
    const rawHash = sha256(`${SALT_PREFIX}${seed}`);
    return `usr_${rawHash.substring(0, 10)}`;
  }

  /**
   * 로컬 스토리지에 캐시된 세션이 있으면 복원하고, 없으면 기본 게스트 세션을 생성합니다.
   */
  public getCurrentUser(): MaritimeUser {
    if (this.currentUser) {
      return this.currentUser;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as MaritimeUser;
          if (parsed && parsed.userHashId && parsed.userHashId.startsWith('usr_')) {
            this.currentUser = parsed;
            return this.currentUser;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 기본 익명 게스트 세션
    const guestUser: MaritimeUser = {
      userHashId: this.generateAnonymousUserId('anonymous-guest-seed'),
      role: 'CHIEF_ENGINEER',
      organization: 'PUBLIC',
      organizationName: '공개 게스트',
      title: '일반 탐색자',
      issuedAt: new Date().toISOString(),
      isAnonymousGuest: true,
    };
    this.currentUser = guestUser;
    return guestUser;
  }

  /**
   * 선급 및 산업체 표준 프리셋을 통한 1-클릭 간편 인증
   */
  public async loginWithPreset(presetId: string): Promise<MaritimeUser> {
    const preset = MARITIME_PRESETS.find((p) => p.id === presetId) || MARITIME_PRESETS[0];
    const seed = `${preset.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userHashId = this.generateAnonymousUserId(seed);

    const user: MaritimeUser = {
      userHashId,
      role: preset.role,
      organization: preset.organization,
      organizationName: preset.organizationName,
      title: preset.title,
      issuedAt: new Date().toISOString(),
      isAnonymousGuest: preset.id === 'GUEST',
    };

    this.currentUser = user;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch {
        // Storage access error handling
      }
    }

    return user;
  }

  /**
   * 로그아웃: 세션을 비우고 기본 게스트 상태로 복귀
   */
  public async logout(): Promise<MaritimeUser> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    this.currentUser = null;
    return this.getCurrentUser();
  }
}

export const maritimeAuthService = new MaritimeAuthService();
