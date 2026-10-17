---
sprint: 1
title: "Sprint 1: Domain UX Rules, 4-Role Storyboards & Data Contract"
status: "COMPLETED"
cycle: "2026-10-17"
project: "marine-sensor-gis"
board: "https://github.com/users/initbtn/projects/2"
review_army_eligible: false
artifacts:
  - path: "docs/domain/maritime-class-standards.md"
    type: "SPEC"
    description: "선급(KR, DNV, ABS) 및 IMO 3대 환경 협약(MARPOL VI, BWM D-2, IACS E26/E27) 정본"
  - path: "docs/domain/maritime-ux-rules.md"
    type: "SPEC"
    description: "실무자 중심 4대 도메인 UX 불변식(절대 임계치, P&ID 미믹, ISA-18.2 알람, 다크 테마)"
  - path: "docs/front-spec.md"
    type: "SPEC"
    description: "4대 직무별(기관사/관제관/감사관/진단원) 상세 스토리보드, 와이어프레임 및 TypeScript Data Contract"
  - path: "docs/scrum/sprint-1-slides.md"
    type: "REPORT"
    description: "팀원 공유용 시각화 슬라이드 덱 보고서"
---

# Sprint 1 Agent-Friendly Scrum Report

## 1. 스프린트 메타데이터 요약 (Machine-Readable JSON)

```json
{
  "sprint": 1,
  "milestone": "Domain UX Rules, Storyboards & Data Contracts",
  "status": "COMPLETED",
  "storyPointsPlanned": 13,
  "storyPointsCompleted": 13,
  "completionRate": 1.0,
  "standardsApplied": [
    "IMO MARPOL Annex VI Reg. 14 / Res. MEPC.340(77)",
    "IMO BWM Convention Reg. D-2",
    "IACS UR E26/E27 Cyber Resilience",
    "ISA-18.2 / IEC 62682 Industrial Alarm Management"
  ],
  "rolesDefined": [
    "CHIEF_ENGINEER",
    "FLEET_OPERATOR",
    "COMPLIANCE_OFFICER",
    "DIAGNOSTIC_TECH"
  ],
  "verification": {
    "vitestTests": 10,
    "vitestPassed": 10,
    "typeCheckErrors": 0
  }
}
```

## 2. 도메인 및 아키텍처 결정 사항 (ADR Summary)
- **리포트 2-Track 전략 채택**:
  - `docs/scrum/sprint-<N>-report.md`: 에이전트 및 자동화 파이프라인 친화적 구조화 마크다운 정본.
  - `docs/scrum/sprint-<N>-slides.md`: 사람 팀원 공유 및 프레젠테이션용 시각화 슬라이드 덱.
- **선급 기준 기반의 절대 임계치 고정**:
  - SOx: 일반 해역 21.7 ppm / ECA 4.3 ppm (ECA 진입 시 게이지 임계치 동적 전환).
  - Washwater pH: 6.5 미만 시 경보, 4.0 미만 시 긴급 비상 차단.
- **ISA-18.2 알람 라이프사이클**:
  - Unacknowledged (점멸) ➔ Acknowledged (점등) ➔ Cleared (아카이빙).

## 3. 프론트엔드 데이터 계약 체크리스트
- [x] `OperatingMode`: `'EDGE' | 'CLOUD'`
- [x] `UserRole`: `'CHIEF_ENGINEER' | 'FLEET_OPERATOR' | 'COMPLIANCE_OFFICER' | 'DIAGNOSTIC_TECH'`
- [x] `RawTelemetryRecord`: 고주파 1초 Onboard 버퍼 모델
- [x] `HourlySummaryRecord`: 1시간 집계 Inland Cloud 모델
- [x] `ComplianceAlarm`: 선급/법정 규제 알람 모델
- [x] `EquipmentHealthScore`: 판호크 5축 설비 건전성 스코어 모델
- [x] `AisVesselPosition`: AISStream 및 시뮬레이터 공용 위치 모델

## 4. 차기 스프린트 (Sprint 2) 작업 대기열
1. Marine Dark 디자인 토큰 및 공통 UI 위젯 (`MetricCard`, `AlertBadge`, `RoleSwitcher`)
2. `GaugeChart.tsx`: IMO 규제 밴드 포함 회전 게이지
3. `RadarChart.tsx`: 5축 판호크 설비 건전성 레이더 차트
4. `HeatmapChart.tsx`: 시간대별 환경 규제 위반 매트릭스 히트맵
5. `MarineMap.tsx`: 선박 선수 침로 회전 렌더링 및 ECA 규제 해역 오버레이
