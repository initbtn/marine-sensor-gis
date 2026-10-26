import { test, expect } from '@playwright/test';

/**
 * E2E 결함 검증 테스트:
 * 1. 지도 상 선박 침로(Heading) 각도 회전 마커 및 항적(Voyage Track Polyline) 표출 검증
 * 2. 5열 패널 설비 탭 전환: [평형수 처리 (BWTS)] 클릭 시 스크러버가 숨겨지고 평형수 카드가 즉시 표출되는지 검증
 */

test.describe('GIS 항적/침로 표출 및 평형수(BWTS) 탭 전환 E2E 결함 검증', () => {
  test('평형수(BWTS) 탭 클릭 시 탈황 카드가 숨겨지고 평형수 메트릭 카드로 즉시 교체 표출되어야 한다', async ({ page }) => {
    await page.goto('/');

    // 1. 초기 상태: 탈황 설비(Scrubber) 카드가 표출되고 평형수 카드는 숨김 상태인지 검증
    const scrubberCard = page.locator('h4:has-text("탈황 설비 (SOx Scrubber)")');
    const bwtsCard = page.locator('h4:has-text("평형수 처리 (BWTS)")');

    await expect(scrubberCard).toBeVisible();
    await expect(page.locator('text=배기가스 SOx').first()).toBeVisible();
    await expect(bwtsCard).not.toBeVisible();

    // 2. "🌊 평형수 처리 (BWTS)" 버튼 클릭
    const bwtsTabBtn = page.locator('button:has-text("평형수 처리 (BWTS)")');
    await expect(bwtsTabBtn).toBeVisible();
    await bwtsTabBtn.click();

    // 3. 전환 검증: 탈황 설비 카드가 숨겨지고, 평형수 카드가 화면 최상단에 전면 노출되는지 검증
    await expect(scrubberCard).not.toBeVisible();
    await expect(bwtsCard).toBeVisible();
    await expect(page.locator('text=평형수 유량').first()).toBeVisible();
    await expect(page.locator('text=잔류 산화물 (TRO)').first()).toBeVisible();
    await expect(page.locator('text=여과기 차압').first()).toBeVisible();
    await expect(page.locator('text=설비 전력 소모').first()).toBeVisible();

    // 4. 다시 "🚢 탈황 설비 (Scrubber)" 버튼 클릭 시 원복 검증
    const scrubberTabBtn = page.locator('button:has-text("탈황 설비 (Scrubber)")');
    await scrubberTabBtn.click();

    await expect(scrubberCard).toBeVisible();
    await expect(bwtsCard).not.toBeVisible();
  });

  test('해양 GIS 지도에 선박 침로 회전 각도, 전방 침로 벡터, 운항 항적 폴리라인이 정상 렌더링되어야 한다', async ({ page }) => {
    await page.goto('/');

    // 1. Leaflet 지도 컨테이너 노출 검증
    const map = page.locator('[data-testid="marine-map"]');
    await expect(map).toBeVisible();

    // 2. 선박 마커의 침로 각도 회전(rotate) 스타일 적용 검증
    const vesselMarkers = page.locator('.custom-vessel-marker');
    await expect(vesselMarkers.first()).toBeVisible();
    
    // 마커 내부의 회전 div 확인 (rotate(...) 포함)
    const markerHtml = await vesselMarkers.first().innerHTML();
    expect(markerHtml).toContain('rotate(');

    // 3. 지도 우상단 범례에 침로 벡터 및 운항 항적 항목 표출 검증 (데스크톱에서는 토글 버튼 숨김)
    await expect(page.locator('[data-testid="btn-toggle-legend"]')).not.toBeVisible();
    await expect(page.locator('text=선박 침로 벡터 (Heading)')).toBeVisible();
    await expect(page.locator('text=운항 항적 (Track)')).toBeVisible();

    // 4. 지도 SVG 레이어에 폴리라인(항적 점선 및 침로 벡터 실선) 패스 존재 검증
    const svgPaths = page.locator('.leaflet-pane svg path');
    expect(await svgPaths.count()).toBeGreaterThanOrEqual(2);
  });

  test('실시간 데드레커닝 항행: 선박 침로(195° SSW) 및 방위 텍스트가 대시보드와 마커 툴팁에 동적으로 표출되어야 한다', async ({ page }) => {
    await page.goto('/');

    // 1. 대시보드 좌측 상단 지도 헤더에 선박 좌표 및 침로 방위 텍스트 노출 검증
    const headingIndicator = page.locator('text=/침로: \\d+° [A-Z]+/');
    await expect(headingIndicator.first()).toBeVisible();

    // 초기 선박 VSL-001 (195° SSW) 표기 확인
    await expect(page.locator('text=/195° SSW/').first()).toBeVisible();

    // 2. Leaflet 맵 마커 상단 툴팁에 선박명과 방위 각도 텍스트가 포함되어 있는지 검증
    const vesselTooltip = page.locator('.leaflet-tooltip');
    await expect(vesselTooltip.first()).toBeVisible();
    await expect(vesselTooltip.first()).toContainText('PANAMAX PIONEER');
    await expect(vesselTooltip.first()).toContainText('195° SSW');

    // 3. 선박 마커 div에 이중 오프셋 translate(-50%, -50%)가 없고 정상 1:1 회전 스타일인지 검증
    const vesselMarker = page.locator('.custom-vessel-marker').first();
    const markerHtml = await vesselMarker.innerHTML();
    expect(markerHtml).not.toContain('translate(-50%, -50%)');
    expect(markerHtml).toContain('rotate(195deg)');
  });

  test('모바일 뷰포트: 지도 범례가 기본 접힘 상태이고, 토글 버튼 클릭 시 정상 표출/닫힘 동작해야 한다', async ({ page }) => {
    // 모바일 뷰포트 설정 (iPhone SE: 375 x 667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggleBtn = page.locator('[data-testid="btn-toggle-legend"]');
    const legendPanel = page.locator('[data-testid="marine-map-legend"]');

    // 1. 모바일에서는 토글 버튼이 보이고, 범례 본문은 기본 숨김(hidden)이어야 한다
    await expect(toggleBtn).toBeVisible();
    await expect(legendPanel).not.toBeVisible();

    // 2. 토글 버튼 클릭 시 범례 본문이 나타나야 한다
    await toggleBtn.click();
    await expect(legendPanel).toBeVisible();
    await expect(page.locator('text=정상 가동 선박')).toBeVisible();

    // 3. 닫기 버튼 클릭 시 다시 숨겨져야 한다
    const closeBtn = page.locator('button[aria-label="범례 닫기"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(legendPanel).not.toBeVisible();
  });
});
