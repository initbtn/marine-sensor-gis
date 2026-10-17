---
sprint: 2
title: "Sprint 2: Marine Dark Design System & Core CDD Charts"
status: "COMPLETED"
cycle: "2026-10-18"
project: "marine-sensor-gis"
board: "https://github.com/users/initbtn/projects/2"
review_army_eligible: true
artifacts:
  - path: "src/styles/theme.ts"
    type: "CODE"
    description: "MarineTheme 디자인 토큰 및 IMO/선급 표준 임계치 상수"
  - path: "src/components/Common/AlertBadge.tsx"
    type: "COMPONENT"
    description: "ISA-18.2 산업용 점멸 알람 배지 위젯"
  - path: "src/components/Common/MetricCard.tsx"
    type: "COMPONENT"
    description: "산업용 실시간 KPI 카드 위젯"
  - path: "src/components/Common/RoleSwitcher.tsx"
    type: "COMPONENT"
    description: "4대 운영 직무 동적 전환 스위처 위젯"
  - path: "src/components/Chart/GaugeChart.tsx"
    type: "COMPONENT"
    description: "IMO 규제 임계치 밴드(SOx 4.3/21.7ppm, pH 6.5) 원형 게이지 차트"
  - path: "src/components/Chart/RadarChart.tsx"
    type: "COMPONENT"
    description: "판호크 5축 설비 건전성(CEMS, 차압, UV, 펌프, 중화제) 레이더 차트"
  - path: "src/components/Chart/HeatmapChart.tsx"
    type: "COMPONENT"
    description: "요일/시간대별 환경 규제 위반 매트릭스 히트맵 차트"
  - path: "src/components/Map/MarineMap.tsx"
    type: "COMPONENT"
    description: "선수 침로(Heading) 회전 마커 및 ECA 규제 해역 오버레이 지도"
  - path: "tests/Sprint2Components.spec.tsx"
    type: "TEST"
    description: "스프린트 2 공통 UI 및 차트 단위 테스트 (7개 케이스)"
  - path: "docs/scrum/sprint-2-slides.md"
    type: "REPORT"
    description: "팀원 공유용 스프린트 2 프레젠테이션 슬라이드 덱"
---

# Sprint 2 Agent-Friendly Scrum Report

## 1. 스프린트 메타데이터 요약 (Machine-Readable JSON)

```json
{
  "sprint": 2,
  "milestone": "Marine Dark Design System & Core CDD Charts",
  "status": "COMPLETED",
  "storyPointsPlanned": 13,
  "storyPointsCompleted": 13,
  "completionRate": 1.0,
  "designSystem": {
    "palette": "Marine High-Contrast Dark",
    "primaryBg": "#0B132B",
    "ecoCyan": "#00F5D4",
    "warningAmber": "#FF9F1C",
    "criticalCrimson": "#E71D36"
  },
  "componentsDelivered": [
    "AlertBadge",
    "MetricCard",
    "RoleSwitcher",
    "GaugeChart",
    "RadarChart",
    "HeatmapChart",
    "MarineMap (Enhanced)"
  ],
  "verification": {
    "totalTests": 17,
    "passedTests": 17,
    "typeCheckErrors": 0,
    "buildDurationSec": 6.12
  }
}
```

## 2. 핵심 구현 사항 및 설계 결정 (ADR Summary)
- **컴포넌트 주도 개발 (CDD)**:
  - 위젯 단위의 독립적인 상태와 렌더링 검증을 위해 `Sprint2Components.spec.tsx`에서 각 컴포넌트별 7개 단위 테스트 작성 및 100% 검증.
- **IMO 임계치 동적 게이지 분할 (`GaugeChart.tsx`)**:
  - `isEcaMode` 플래그 및 `thresholdValue` 프로퍼티에 따라 Green(정상), Yellow(경보), Red(위험) 구간이 실시간으로 동적 스냅 분할되도록 구현.
- **판호크 5축 건전성 지수 (`RadarChart.tsx`)**:
  - 선급 형식승인 100점 기준선(점선)과 현재 선박 설비 측정치(시안색 채움 다각형)를 대비하여 예지보전 직관성 확보.
- **GIS 침로 회전 및 ECA 오버레이 (`MarineMap.tsx`)**:
  - 선수각 `headingDeg` 회전 마커에 고대비 드롭 섀도우를 적용하고, 부산항-대한해협 연안 ECA 폴리곤(황색 점선)과 맵 범례(Legend) 오버레이 추가.

## 3. 차기 스프린트 (Sprint 3) 계획
- **주제**: Supabase 2중 물리 스키마(`marine_edge`, `marine_control`) DDL 및 Store-and-Forward 동기화 엔진 TDD.
- **주요 산출물**:
  1. `supabase/migrations/001_dual_schema_setup.sql`
  2. `src/services/dualDbSyncEngine.ts` (오프라인 롤링 버퍼 및 배치 동기화)
  3. `tests/dualDbSyncEngine.spec.ts`
  4. `src/services/aisStreamService.ts` (실시간 AISStream 하이브리드 어댑터)
