import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation & GIS Map E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
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
  });

  test('데스크톱 환경에서 App Shell 상단 내비게이션으로 /gis 페이지로 전환하고 지도 및 선단 제어 컨트롤이 표출되어야 한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. GIS 페이지 탭 클릭
    const gisTab = page.getByRole('link', { name: /해양 GIS 지도/i });
    await expect(gisTab).toBeVisible();
    await gisTab.click();

    await expect(page).toHaveURL(/\/gis/);
    await expect(page.getByTestId('full-gis-page')).toBeVisible();

    // 2. 전체 선단 보기 버튼 및 선택 선박 추적 버튼 노출 확인
    const fitFleetBtn = page.getByTestId('btn-fit-fleet');
    await expect(fitFleetBtn).toBeVisible();
    await fitFleetBtn.click();

    // 3. Leaflet 맵 마커 존재 확인
    const markers = page.locator('.custom-vessel-marker');
    expect(await markers.count()).toBeGreaterThanOrEqual(1);
  });

  test('모바일 뷰포트(375x667)에서 하단 바텀 내비게이션 바가 렌더링되고 페이지 전환이 가능해야 한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. 모바일 하단 내비게이션 바 노출 확인
    const mobileNav = page.locator('nav[aria-label="모바일 하단 내비게이션"]');
    await expect(mobileNav).toBeVisible();

    // 2. 하단 내비게이션 내 '해양 GIS 지도' 터치 타깃 (>= 44px) 확인 및 클릭
    const gisLink = mobileNav.getByRole('link', { name: /해양 GIS 지도/i });
    await expect(gisLink).toBeVisible();
    const box = await gisLink.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await gisLink.click();
    await expect(page).toHaveURL(/\/gis/);
    await expect(page.getByTestId('full-gis-page')).toBeVisible();
  });
});
