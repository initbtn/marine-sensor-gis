import { test, expect } from '@playwright/test';

/**
 * 2-Tier Test Strategy - Tier 2: E2E Smoke & Post-Deploy Verification
 * 
 * [설계 원칙]
 * 1. Client TDD: 외부 의존성을 목(Mock) 데이터로 격리한 초고속 단위 테스트 (Vitest: `npm test`)
 * 2. E2E Tests: 배포 직후(Post-deploy) 시점 및 라이브 디버그용 (Playwright: `npm run test:e2e`)
 *    - 인증(Authentication) 및 결제(Billing)는 외부 PG/SSO 의존성 대신 세션 쿠키/스토리지 수동 주입 또는 테스트 모드로 처리.
 */

test.describe('Post-Deploy Smoke & HMI Control Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // 1. 수동 인증 및 결제 활성화 세션 모의 주입 (Dynamic baseURL-aware Injection)
    const targetUrl = test.info().project.use.baseURL || 'http://localhost:5173';
    await context.addCookies([
      {
        name: 'marine_session_token',
        value: 'mock_operator_valid_session_token',
        url: targetUrl,
      },
      {
        name: 'marine_license_tier',
        value: 'ENTERPRISE_PAID_ACTIVE',
        url: targetUrl,
      },
    ]);

    // 브라우저 로컬 스토리지에 운영자 역할 및 결제 구독 상태 사전 설정
    await page.addInitScript(() => {
      window.localStorage.setItem('marine_user_role', 'CHIEF_ENGINEER');
      window.localStorage.setItem('marine_billing_status', 'PAID_VERIFIED');
    });
  });

  test('배포 직후 메인 HMI 관제 대시보드가 정상 렌더링되어야 한다', async ({ page }) => {
    // 배포 환경 URL 또는 로컬 개발 서버 진입
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // 1. 헤더 타이틀 및 HMI 상태 확인
    const headerTitle = page.locator('header h1, header');
    await expect(headerTitle.first()).toBeVisible();

    // 2. ISA-101 / IEC 62288 알람 리스트 또는 센서 요약 카드 영역 노출 검증
    const dashboardRoot = page.locator('main');
    await expect(dashboardRoot).toBeVisible();

    // 3. Leaflet GIS 지도 컨테이너 존재 검증
    const mapContainer = page.locator('.leaflet-container, [data-testid="marine-map"], #map');
    expect(await mapContainer.count()).toBeGreaterThan(0);
  });

  test('치명적 콘솔 런타임 에러(Uncaught Exception) 없이 부트스트랩되어야 한다', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('pageerror', (exception) => {
      errorLogs.push(exception.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 리액트 크래시 또는 치명적 미처리 런타임 예외가 없어야 함
    expect(errorLogs).toEqual([]);
  });

  test('선박 에지 ⇄ 내륙 클라우드 모드 토글 및 위성 네트워크 상태 전환이 동작해야 한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. 관제 모드 토글 및 클라우드 집계 패널 노출 검증
    const cloudBtn = page.getByRole('button', { name: '🏢 내륙 클라우드' }).first();
    await expect(cloudBtn).toBeVisible();
    await cloudBtn.click();
    await expect(page.getByTestId('cloud-aggregated-summary')).toBeVisible();
    await expect(page.getByText('당월 환경 규제 준수율')).toBeVisible();

    // 2. 위성 네트워크 상태 토글 검증
    const networkBtn = page.getByTestId('network-toggle-btn').first();
    await expect(networkBtn).toBeVisible();
    await networkBtn.click();
    await expect(page.getByText(/위성 링크 단절 \(Offline\)/i).first()).toBeVisible();

    // 3. 대기 큐 인디케이터 표시 검증
    await expect(page.getByText(/대기 큐:/i).first()).toBeVisible();
  });
});
