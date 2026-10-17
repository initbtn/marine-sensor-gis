# EcoMarine GIS 관제 플랫폼 기획 정본 명세서 (Project Planning Overview)

> **문서 상태**: APPROVED (SSOT 정본)  
> **프로젝트명**: 파나시아(PANASIA) 친환경 설비 실시간 센서 모니터링 & 해양 GIS 원격 위성관제 플랫폼 (EcoMarine Control Platform)  
> **대상 저장소**: [initbtn/marine-sensor-gis](https://github.com/initbtn/marine-sensor-gis)  
> **최종 갱신일**: 2026-10-17  
> **버전**: v2.4.0 (파나시아 개발문화, 선급 인증 도메인, 데이터시각화 디자인 시스템 및 프론트엔드 단계별 워크플로우 전면 반영)

---

## 1. 프로젝트 주제 및 산업 도메인 배경 (Theme & Domain Background)

### 1.1. 관제 대상 및 핵심 주제
본 프로젝트는 글로벌 해양 친환경 설비 선도기업인 **파나시아(PANASIA)**의 친환경 솔루션(ES) 장비를 대상으로, 국제해사기구(IMO) 환경 규제 준수 상태를 전 세계 대양에서 실시간으로 감시하고 위성 통신 단절 시에도 데이터 유실이 없도록 보장하는 **산업용 해양 GIS 위성 원격 관제 웹 플랫폼**입니다.

### 1.2. 파나시아(PANASIA) 주력 친환경 설비 및 규제 기준 지표
1. **`PaSOx` (선박 배기가스 탈황 스크러버 — IMO MARPOL Annex VI 준수)**:
   - **배기가스 감시 지표**: SOx 농도(< 25 ppm 감시), SO2/CO2 비율($\le$ 4.3 감시)
   - **배출 세정수(Washwater) 환경 감시 지표**:
     - 배출수 산성도: **pH $\ge$ 6.5 강제 감시** (해양 산성화 방지 규제)
     - 배출수 탁도 (Turbidity): **25 FTU(NTU) 미만 감시**
     - 다환방향족탄화수소 (PAH): **50 ppb 미만 감시**
     - 세정수 펌프 공급 유량 (m³/h) 및 스크러버 타워 차압 (Pressure Drop, kPa)

2. **`GloEn-Patrol` (선박 평형수 처리 설비, BWTS — IMO BWM D-2 / USCG 준수)**:
   - **살균/소독 감시 지표**: 소독 잔류 산화물질 농도 (**TRO < 0.2 ppm 감시**)
   - **운전 상태 지표**: 평형수 주입/배출 유량 (m³/h), 여과기 전후 차압 (Filter Pressure Drop, kPa), UV Lamp 조사 강도 (W/m²), 중화제 주입량 (L/h)

3. **`PaCCUS` (선박 탄소 포집 및 저장 설비, OCCS)**:
   - IMO 2030/2050 온실가스 감축(Net-Zero) 대응 CO2 포집률(%) 추적 인터페이스

---

## 2. ES(친환경 솔루션)팀 맞춤형 데이터 시각화 스택 (Data Visualization Tech Stack)

친환경 설비(ES) 엔지니어링 및 스마트 해양 IoT 플랫폼의 실무 역량을 증명하기 위해, 단일 차트를 넘어 산업계에서 요구하는 **다양한 차트 컴포넌트 라이브러리 및 GIS 엔진**을 총동원합니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   데이터 시각화 스택 아키텍처                          │
├───────────────────┬───────────────────┬────────────────────────────────┤
│    Leaflet GIS    │   Apache ECharts  │     Lucide & 모던 UI 위젯      │
│  (해양 지리정보)  │ (시계열·게이지·레이더) │    (KPI 카드·상태 인디케이터)    │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ - 선박 위치/침로  │ - Multi-axis Line │ - 1초 실시간 센서 KPI 카드     │
│ - 실시간 항적 궤적│ - Industrial Gauge│ - 위성 연결 상태 인디케이터    │
│ - ECA 규제 해역   │ - Equipment Radar │ - Store-and-Forward 큐 배지    │
│ - 항구/터미널 POI │ - Trend Area/Bar  │ - IMO 규제 알람 타임라인       │
│                   │ - Calendar Heatmap│ - 전자 기록부(Record Book) 표  │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

| 시각화 컴포넌트 | 차트 유형 | 관제 화면 내 역할 및 실무 가치 |
|---|---|---|
| **실시간 고주파 텔레메트리** | `Multi-axis Line Chart` | SOx ppm, pH, TRO 농도, 유량(Flow Rate)의 동시 변동 추이 감시 |
| **IMO 규제 한계치 게이지** | `Circular Gauge Chart` | MARPOL SOx 규제치(4.3ppm/21.7ppm) 및 세정수 pH(6.5) 안전/위험 밴드 |
| **설비 헬스 인덱스** | `Radar Chart` (방사형 레이더) | CEMS 센서 신뢰도, 필터 차압 여유, UV 램프 수명 등 5개 축 종합 건전성 |
| **선단 가동 상태 분포** | `Doughnut Chart` (도넛) | 정상 가동 선박 vs 경보 선박 vs 규제 위반 선박의 전체 비율 파악 |
| **선단 배출량 비교** | `Bar Chart` (막대 그래프) | 선박별 일간 배출수 유량 및 연료 절감 효율 비교 분석 |
| **알람 발생 매트릭스** | `Heatmap Chart` (히트맵) | 요일/시간대별 규제 임계치 초과 발생 빈도 히트맵 (이상 패턴 분석) |
| **해양 GIS 관제 지도** | `Leaflet Marine Map` | 선박 선수 각도(Heading) 회전 마커, 실시간 이동 항적(Track), ECA 규제 해역 |

---

## 3. 4대 운영 계정(Role-Based)별 맞춤형 대시보드 기획 (Multi-Role Dashboards)

대시보드 상단에 **운영 계정(Role) 스위처**를 제공하여, 접속 계정의 직무와 목적에 따라 최적화된 시각화 레이아웃으로 실시간 동적 전환됩니다.

```
 [운영 계정 스위처]
  ├── 1. 🚢 선박 기관사 (Chief Engineer) ───► 설비 중심 / 0ms 고주파 계측 / 즉시 조치
  ├── 2. 🏢 육상 관제관 (Fleet Operator) ────► 선단 중심 / 글로벌 해양 GIS / 운항 종합
  ├── 3. ⚖️ 규제 감사관 (Compliance Officer) ─► 감사 중심 / 법적 준수율 / 위반 이력 리포트
  └── 4. 🔧 원격 진단원 (Pan-Hawk Tech) ────► 진단 중심 / 레이더 헬스 / 센서 예지보전
```

### 3.1. [계정 1] 선박 기관사 뷰 (Chief Engineer View - Onboard Edge)
* **목적**: 선박 현장 기관실에서 장비의 물리적 이상을 0ms 무지연으로 확인하고 긴급 조치.
* **주요 시각화 위젯**:
  1. **실시간 원형 게이지 (Gauge)**: PaSOx SOx ppm 게이지 (0~30ppm), 배출수 pH 게이지 (4~10pH, 6.5 경계선).
  2. **초 단위 고주파 실시간 차트 (Line)**: 1초 간격 실시간 펄스 파형 및 이상치 스파이크 감지.
  3. **실시간 알람 제어 콘솔**: CRITICAL 알람 발생 시 시각적 점멸 및 기관사 원클릭 확인(Acknowledge) 처리.
  4. **에지 버퍼 상태 바**: 선박 로컬 롤링 버퍼 보관 일수 및 위성 단절 대기 큐(`PENDING`) 건수.

### 3.2. [계정 2] 육상 선단 관제관 뷰 (Fleet Operator View - Inland Control Room)
* **목적**: 육상 관제실에서 전 세계 바다를 운항 중인 모든 선박의 위치와 친환경 설비 가동 상태를 총괄 관제.
* **주요 시각화 위젯**:
  1. **해양 GIS 관제 맵 (전면 확장 Leaflet)**: 전 선박 마커, 침로 회전 렌더링, 최근 24시간 항적 폴리라인, 배출규제해역(ECA) 경계선 오버레이.
  2. **선단 상태 도넛 차트 (Doughnut)**: 정상 가동 선박(초록) vs 주의 선박(노랑) vs 규제 초과 선박(빨강) 분포.
  3. **선단 배출 총량 막대 차트 (Bar)**: 선박별/항로별 세정수 배출량 및 연료 절감 효율 비교.

### 3.3. [계정 3] 환경규제 감사관 뷰 (Compliance Officer View - IMO / Class Auditor)
* **목적**: IMO 및 선급(Class) 검사관 대상 법정 환경 규제 준수율 증빙 및 위반 이력 정밀 감사.
* **주요 시각화 위젯**:
  1. **IMO 종합 준수율 게이지 (Compliance Rate %)**: 당월 환경 규제 준수율 (목표 99.5% 대비 달성률).
  2. **규제 위반 발생 히트맵 (Heatmap Matrix)**: 날짜/시간대별 위반 발생 패턴(항구 입항 전후 등) 분석.
  3. **전자 기록부 테이블 (MARPOL / BWM Electronic Record Book)**: 위성 동기화로 검증된 시간별 법정 기록 조회 및 CSV/PDF 내보내기 버튼.

### 3.4. [계정 4] 원격 진단 엔지니어 뷰 (Remote Diagnostic Engineer - Panasia Pan-Hawk)
* **목적**: 파나시아 육상 서비스 센터에서 선박 장비의 부품 수명 및 센서 드리프트를 원격 진단하여 비대면 A/S 지원.
* **주요 시각화 위젯**:
  1. **설비 건전성 레이더 차트 (Equipment Health Radar)**: 5개 축(CEMS 센서 신뢰도, 필터 차압 여유도, UV 램프 잔여수명, 세정수 펌프 효율, 중화제 제어 안정성).
  2. **상관관계 산점도 (Scatter Chart)**: 평형수 처리 유량 vs 여과기 차압 상관관계 (역세척 주기 이상 징후 조기 포착).
  3. **예지보전 타임라인 (Predictive Maintenance Log)**: 소모품(UV 램프, pH 센서 전극) 교체 권장 주기 추정치 표시.

---

## 4. 파나시아 개발문화 및 선급 인증 도메인 연계 (Panasia Culture & Class Domain)

### 4.1. 파나시아(PANASIA) R&D 및 개발 조직 문화
- **연구 조직**: ES연구소(친환경설비연구팀), 디지털혁신실, IT연구팀.
- **핵심 역량**: 실물 제어기(PLC/CEMS/임베디드 통신)와 Web/Cloud의 결합, 해상위성원격관제(MSCS / 판호크 Pan-Hawk).
- **개발 원칙**: 위성 환경의 대역폭 한계와 통신 단절을 극복하는 **데이터 무결성(Store-and-Forward)**과 규제 감사 적합성.

### 4.2. 선급(Classification Society) 및 IMO 표준 인증
- **선급 협회 (IACS)**: KR(한국선급), DNV, ABS, LR, BV 등.
- **형식 승인 (Type Approval)**: 친환경 설비 성능과 안전성의 법적 원천 인증.
- **상세 규정 가이드**: [`docs/domain/maritime-class-standards.md`](./domain/maritime-class-standards.md)에 상세 명세.

---

## 5. 데이터 시각화 디자인 시스템 벤치마킹 (Design System Benchmarking)

* **선정 디자인 패턴**:
  - **IBM Carbon Design System (`carbon-charts`)**: 엔터프라이즈 데이터 시각화 표준, 고대비 다크 테마 및 계측 팔레트.
  - **Tremor / Grafana UI**: 컴팩트 KPI 메트릭 카드 및 실시간 알람 배지 레이아웃.
* **디자인 토큰 (Marine Telemetry Palette)**:
  - 심해 네이비 (Background): `#0B132B` / `#1C2541`
  - 에코 시안 (Normal / Brand): `#00F5D4` / `#48CAE4`
  - 경보 앰버 (Warning): `#FF9F1C`
  - 위험 크림슨 (Critical): `#E71D36`
  - 텍스트 (Foreground): `#F8F9FA` / `#ADB5BD`

---

## 6. 하이브리드 선박 위치 수집 아키텍처 (AISStream.io + 시뮬레이터)

선박의 실제 해상 위치와 모의 설비 데이터를 결합하는 하이브리드 수집 구조를 채택합니다:
- **실시간 모드**: [AISStream.io](https://aisstream.io/) WebSocket 스트림 (`VITE_AISSTREAM_API_KEY` 설정 시 자동 가동).
- **시뮬레이션 모드 (기본)**: API 키 없이도 부산항, 대한해협, ECA 규제 해역을 통항하는 선박의 고정밀 항적 즉시 구동.

---

## 7. 인프라 아키텍처 및 Supabase 2중 스키마 물리 격리

```
Supabase PostgreSQL DB Instance (기존 busan-youth-day / resume-vuejs 100% 격리 보존)
 │
 ├── [marine_edge 스키마]      ──► 🚢 선박 에지 로컬 적재 DB 전용
 │    ├── local_telemetry       (초 단위 Raw 데이터, 최근 7일 롤링 버퍼, sync_status 관리)
 │    └── edge_sync_queue       (위성 단절 PENDING 큐 및 배치 전송 이력)
 │
 └── [marine_control 스키마]   ──► 🏢 육상 내륙 대용량 관제 DB 전용
      ├── vessels               (선박 마스터 제원 및 PostGIS 위치: GEOGRAPHY(POINT, 4326))
      ├── hourly_telemetry_summary (1시간/1일 통계 집계 요약: avg, max, min, 유량 누적)
      ├── compliance_alarm_logs (IMO 법정 규제 위반 알람 및 조치 이력)
      └── equipment_diagnostics (파나시아 판호크용 예지보전 건전성 지표)
```

---

## 8. 단계별 실행 로드맵 및 표준 프론트엔드 워크플로우 (Milestones)

| 단계 | 구분 | 목표 및 핵심 산출물 | 상태 |
|---|---|---|---|
| **Phase 1** | **인프라 & 백엔드 기반 신속 완결** | • GitHub Issue & Projects #2 연동<br>• `supabase/migrations/001_dual_schema_setup.sql`<br>• `dualDbSyncEngine.ts` (Store-and-Forward TDD)<br>• `aisStreamService.ts` (하이브리드 AIS 피드) | **착수 예정** |
| **Phase 2** | **프론트 기획 & 디자인 시스템** | • `docs/front-spec.md` (4대 직무 UX/UI 명세 및 와이어프레임)<br>• Marine Dark 디자인 토큰 정의<br>• 공통 UI 위젯 (`MetricCard`, `AlertBadge`, `RoleSwitcher`) | 대기 |
| **Phase 3** | **시각화 컴포넌트 CDD** | • `GaugeChart.tsx` (SOx/pH 원형 게이지)<br>• `RadarChart.tsx` (5축 건전성 레이더)<br>• `HeatmapChart.tsx` (위반 매트릭스 히트맵)<br>• `MarineMap.tsx` 고도화 (침로 회전 & ECA 오버레이) | 대기 |
| **Phase 4** | **4대 직무 대시보드 조립** | • `ChiefEngineerDashboard` (에지 고주파)<br>• `FleetOperatorDashboard` (GIS 총괄)<br>• `ComplianceOfficerDashboard` (선급 감사 리포트)<br>• `DiagnosticTechDashboard` (예지보전 산점도) | 대기 |
| **Phase 5** | **종합 검증 및 리뷰 (E2E)** | • Vitest 단위 테스트 & 타입 검사 100% 무결점<br>• `review-army` 서브에이전트 감사<br>• 사용자 승인 및 머지/배포 | 대기 |
