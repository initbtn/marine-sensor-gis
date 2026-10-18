import { test, expect } from '@playwright/test';

/**
 * Sprint 6 E2E Verification:
 * Zero-PII Maritime Cyber Security Auth & Access Audit Trail Dashboard
 * IACS UR E26/E27 and IMO MSC.428(98) compliance
 */

test.describe('Sprint 6: Maritime Zero-PII Auth & Audit Dashboard E2E', () => {
  test('1-클릭 선급 인증 플로우: 한국선급(KR) 감사관 로그인 시 usr_**** 식별자 칩 노출 검증', async ({ page }) => {
    await page.goto('/');

    // 1. 헤더의 "선급 1-클릭 인증" 버튼 클릭
    const loginBtn = page.locator('[data-testid="header-login-btn"]');
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    // 2. 모달 노출 및 Zero-PII 준수 문구 확인
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('text=선급 & 산업체 표준 사이버보안 인증')).toBeVisible();
    await expect(page.locator('text=Zero-PII 무결성 보장')).toBeVisible();

    // 3. 한국선급(KR) 감사관 프리셋 선택
    const krPresetBtn = page.locator('[data-testid="preset-btn-KR_SURVEYOR"]');
    await expect(krPresetBtn).toBeVisible();
    await krPresetBtn.click();

    // 4. 모달이 닫히고 헤더에 usr_**** 식별자 칩이 노출되는지 확인
    await expect(modal).not.toBeVisible();
    const userChip = page.locator('[data-testid="header-user-chip"]');
    await expect(userChip).toBeVisible();
    await expect(userChip).toContainText('usr_');
    await expect(userChip).toContainText('KR');
  });

  test('/audit 경로 진입 시 실시간 활성 유저 통계 및 식별자 감사 트레일 테이블 렌더링 검증', async ({ page }) => {
    await page.goto('/audit');

    // 1. 페이지 헤더 및 Zero-PII 준수 배너 확인
    const auditPage = page.locator('[data-testid="audit-dashboard-page"]');
    await expect(auditPage).toBeVisible();
    await expect(page.locator('text=Zero-PII 접속 감사 트레일 & 실시간 활성 유저 통계')).toBeVisible();
    await expect(page.locator('text=Zero-PII 법정 규제 준수 상태: 무결 (Pass)')).toBeVisible();

    // 2. 3대 핵심 메트릭 카드 확인
    await expect(page.locator('[data-testid="metric-card-실시간-동시-접속자-수"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-당일-누적-활성-사용자-(dau)"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-당일-시스템-조작-이벤트"]')).toBeVisible();

    // 3. 감사 트레일 테이블 행 및 usr_ 해시 식별자 확인
    const tableRows = page.locator('[data-testid="audit-log-row"]');
    await expect(tableRows.first()).toBeVisible();
    const firstRowText = await tableRows.first().textContent();
    expect(firstRowText).toContain('usr_');
  });

  test('비상 바이패스 조작 시 감사 로그 자동 기록 연계 검증', async ({ page }) => {
    // 1. 관제 대시보드 진입
    await page.goto('/');

    // 2. 비상 바이패스 버튼 클릭
    const bypassBtn = page.locator('button:has-text("비상 바이패스")');
    if (await bypassBtn.isVisible()) {
      await bypassBtn.click();
    }

    // 3. 감사 대시보드로 이동
    await page.goto('/audit');

    // 4. 액션 셀렉터에서 '비상 바이패스 조작' 선택
    const filterSelect = page.locator('select[aria-label="액션 필터"]');
    await expect(filterSelect).toBeVisible();
    await filterSelect.selectOption('BYPASS_TOGGLE');

    // 5. 바이패스 조작 이벤트가 감사 트레일에 존재하는지 확인
    const filteredRows = page.locator('[data-testid="audit-log-row"]');
    await expect(filteredRows.first()).toBeVisible();
    await expect(filteredRows.first()).toContainText('비상 바이패스 조작');
  });
});
