import { describe, it, expect, beforeEach } from 'vitest';
import { maritimeAuthService, MARITIME_PRESETS } from '../src/services/maritimeAuthService';
import { accessAuditService } from '../src/services/accessAuditService';
import { useMarineDashboardStore } from '../src/stores/useMarineDashboardStore';

describe('Sprint 6: Zero-PII Maritime Auth & Access Audit Service', () => {
  beforeEach(() => {
    accessAuditService.resetBuffer();
    useMarineDashboardStore.getState().reset();
  });

  describe('1. 비가역 단방향 해시 식별자 (usr_****) 무결성', () => {
    it('동일한 시드에 대해 항상 결정론적(Deterministic) 10자리 16진수 해시를 생성해야 한다', () => {
      const seed = 'test-seed-surveyor-001';
      const hash1 = maritimeAuthService.generateAnonymousUserId(seed);
      const hash2 = maritimeAuthService.generateAnonymousUserId(seed);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^usr_[a-f0-9]{10}$/);
      expect(hash1.length).toBe(14); // 'usr_' (4) + 10 chars = 14
    });

    it('서로 다른 시드에 대해 상이한 해시 식별자를 생성해야 한다', () => {
      const hashA = maritimeAuthService.generateAnonymousUserId('seed-A');
      const hashB = maritimeAuthService.generateAnonymousUserId('seed-B');

      expect(hashA).not.toBe(hashB);
      expect(hashA).toMatch(/^usr_[a-f0-9]{10}$/);
      expect(hashB).toMatch(/^usr_[a-f0-9]{10}$/);
    });
  });

  describe('2. Zero-PII (개인정보 미수집) 원칙 엄격 검증', () => {
    it('모든 선급 프리셋 객체에 PII(이메일, 실명, 전화번호, 원본 IP) 속성이 일체 없어야 한다', () => {
      const forbiddenKeys = ['email', 'realName', 'phoneNumber', 'phone', 'ip', 'rawIp', 'clientIp'];

      MARITIME_PRESETS.forEach((preset) => {
        const keys = Object.keys(preset);
        forbiddenKeys.forEach((forbidden) => {
          expect(keys).not.toContain(forbidden);
        });
      });
    });

    it('발급된 MaritimeUser 객체에 PII 속성이 일체 없어야 한다', async () => {
      const user = await maritimeAuthService.loginWithPreset('KR_SURVEYOR');
      const userKeys = Object.keys(user);

      expect(userKeys).not.toContain('email');
      expect(userKeys).not.toContain('phoneNumber');
      expect(userKeys).not.toContain('phone');
      expect(userKeys).not.toContain('ip');
      expect(user.userHashId).toMatch(/^usr_[a-f0-9]{10}$/);
      expect(user.organization).toBe('KR');
      expect(user.role).toBe('COMPLIANCE_OFFICER');
    });

    it('기록된 AccessAuditLog 객체에 PII 속성이 일체 없어야 한다', async () => {
      const log = await accessAuditService.logAuditEvent({
        actionType: 'BYPASS_TOGGLE',
        targetPath: '/',
      });

      const logKeys = Object.keys(log);
      expect(logKeys).not.toContain('email');
      expect(logKeys).not.toContain('ip');
      expect(logKeys).not.toContain('phoneNumber');
      expect(log.userHashId).toMatch(/^usr_[a-f0-9]{10}$/);
      expect(log.actionType).toBe('BYPASS_TOGGLE');
    });
  });

  describe('3. 선급 및 산업체 프리셋 인증 & 세션 해제', () => {
    it('KR 선급 감사관 프리셋 인증 시 세션 정보가 정상 설정되어야 한다', async () => {
      const user = await maritimeAuthService.loginWithPreset('KR_SURVEYOR');
      expect(user.organization).toBe('KR');
      expect(user.role).toBe('COMPLIANCE_OFFICER');
      expect(user.title).toContain('KR');
      expect(user.isAnonymousGuest).toBe(false);

      const current = maritimeAuthService.getCurrentUser();
      expect(current.userHashId).toBe(user.userHashId);
    });

    it('DNV 선급 검사관 프리셋 인증 시 세션 정보가 정상 설정되어야 한다', async () => {
      const user = await maritimeAuthService.loginWithPreset('DNV_SURVEYOR');
      expect(user.organization).toBe('DNV');
      expect(user.role).toBe('COMPLIANCE_OFFICER');
      expect(user.title).toContain('DNV');
    });

    it('로그아웃 시 익명 게스트 세션으로 초기화되어야 한다', async () => {
      await maritimeAuthService.loginWithPreset('CHIEF_ENGINEER');
      const guest = await maritimeAuthService.logout();

      expect(guest.isAnonymousGuest).toBe(true);
      expect(guest.organization).toBe('PUBLIC');
      expect(guest.userHashId).toMatch(/^usr_[a-f0-9]{10}$/);
    });
  });

  describe('4. 접속 감사 트레일 & 실시간 통계 계산', () => {
    it('감사 이벤트 기록 시 최신 순으로 버퍼에 누적되어야 한다', async () => {
      const initialLogs = await accessAuditService.getRecentAuditLogs(10);
      const initialCount = initialLogs.length;

      await accessAuditService.logAuditEvent({
        actionType: 'ALARM_ACK',
        targetPath: '/alarms',
      });

      const updatedLogs = await accessAuditService.getRecentAuditLogs(10);
      expect(updatedLogs.length).toBe(initialCount + 1);
      expect(updatedLogs[0].actionType).toBe('ALARM_ACK');
      expect(updatedLogs[0].targetPath).toBe('/alarms');
    });

    it('실시간 동시 접속자 수 및 당일 DAU 통계가 양수로 정상 계산되어야 한다', async () => {
      const stats = await accessAuditService.getActiveUserStats();
      expect(stats.activeNowCount).toBeGreaterThanOrEqual(1);
      expect(stats.dauCount).toBeGreaterThanOrEqual(1);
      expect(stats.totalActionsToday).toBeGreaterThanOrEqual(1);
      expect(stats.roleBreakdown).toBeDefined();
    });
  });

  describe('5. useMarineDashboardStore 연동', () => {
    it('스토어의 loginWithPreset 호출 시 currentUser와 currentRole이 갱신되어야 한다', async () => {
      const store = useMarineDashboardStore.getState();
      const user = await store.loginWithPreset('DIAGNOSTIC_TECH');

      expect(useMarineDashboardStore.getState().currentUser.userHashId).toBe(user.userHashId);
      expect(useMarineDashboardStore.getState().currentRole).toBe('DIAGNOSTIC_TECH');
    });

    it('스토어의 logout 호출 시 익명 게스트로 세션이 리셋되어야 한다', async () => {
      const store = useMarineDashboardStore.getState();
      await store.loginWithPreset('KR_SURVEYOR');
      await store.logout();

      const state = useMarineDashboardStore.getState();
      expect(state.currentUser.isAnonymousGuest).toBe(true);
      expect(state.currentUser.organization).toBe('PUBLIC');
    });
  });
});
