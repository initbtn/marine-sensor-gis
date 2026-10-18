# EcoMarine GIS 관제 플랫폼 기획 정본 명세서 (Project Planning Overview)

> **문서 상태**: APPROVED (SSOT 정본)  
> **프로젝트명**: 파나시아(PANASIA) 친환경 설비 실시간 센서 모니터링 & 해양 GIS 원격 위성관제 플랫폼 (EcoMarine Control Platform)  
> **대상 저장소**: [initbtn/marine-sensor-gis](https://github.com/initbtn/marine-sensor-gis)  
> **최종 갱신일**: 2026-10-18  
> **버전**: v3.0.0 (공공데이터포털 PORT-MIS, 글로벌 AISStream, 4대 인프라 아키텍처 및 실측 데이터 계약 반영)

---

## 1. 프로젝트 주제 및 산업 도메인 배경 (Theme & Domain Background)

### 1.1. 관제 대상 및 핵심 주제
본 프로젝트는 글로벌 해양 친환경 설비 선도기업인 **파나시아(PANASIA)**의 친환경 솔루션(ES) 장비를 대상으로, 국제해사기구(IMO) 환경 규제 준수 상태를 전 세계 대양에서 실시간으로 감시하고 위성 통신 단절 시에도 데이터 유실이 없도록 보장하는 **산업용 해양 GIS 위성 원격 관제 웹 플랫폼**입니다.

### 1.2. 파나시아(PANASIA) 주력 친환경 설비 및 규제 기준 지표
1. **`PaSOx` (선박 배기가스 탈황 스크러버 — IMO MARPOL Annex VI 준수)**:
   - **배기가스 감시 지표**: SOx 농도(< 25 ppm 감시), SO2/CO2 비율($\le$ 4.3 ECA 감시, $\le$ 21.7 Global)
   - **배출 세정수(Washwater) 환경 감시 지표**:
     - 배출수 산성도: **pH $\ge$ 6.5 강제 감시** (< 4.0 긴급 차단 트립)
     - 배출수 탁도 (Turbidity): **25 FTU(NTU) 미만 감시**
     - 다환방향족탄화수소 (PAH): **50 ppb 미만 감시**
     - 세정수 펌프 공급 유량 (m³/h) 및 스크러버 타워 차압 (Pressure Drop, kPa)

2. **`GloEn-Patrol` (선박 평형수 처리 설비, BWTS — IMO BWM D-2 / USCG 준수)**:
   - **살균/소독 감시 지표**: 소독 잔류 산화물질 농도 (**TRO < 0.2 ppm 감시**)
   - **운전 상태 지표**: 평형수 주입/배출 유량 (m³/h), 여과기 전후 차압 (Filter DP $\ge$ 1.0 bar 자동 역세척, $\ge$ 1.5 bar 알람), UV Lamp 조사 강도 (W/m² $\ge$ 250), 중화제 주입량 (L/h)

3. **`PaCCUS` (선박 탄소 포집 및 저장 설비, OCCS)**:
   - IMO 2030/2050 온실가스 감축(Net-Zero) 대응 CO2 포집률(%) 추적 인터페이스

---

## 2. 3단 결합 해양 데이터 수집 아키텍처 (Hybrid Data Pipeline)

실제 해양 데이터의 물리적 특성을 고려하여 3가지 데이터 소스를 유기적으로 결합합니다:

```
[1. 공공데이터포털 (data.go.kr)] ──► 해양수산부 PORT-MIS 선박제원(총톤수, 호출부호, 선종, LOA)
                  │
[2. 글로벌 위성 AIS (AISStream)] ──► 실시간 초 단위 선박 위경도 GPS 및 선수각(TrueHeading)
                  │
[3. GCP 선박 엣지 물리엔진]     ──► IMO MEPC.340(77) 10Hz 센서 연산(SOx/CO2, pH, 차압, UV)
                  │
                  ▼
    [EcoMarine 관제 플랫폼 통합 표출]
```

* **데이터 계약 명세서**: [`docs/spec/maritime-openapi-data-contract.md`](./spec/maritime-openapi-data-contract.md)
* **공공데이터 API 활용 가이드**: [`docs/api/`](./api/)

---

## 3. 4대 클라우드-엣지 인프라 구성

1. **GCP 선박 엣지 VM (`marine-edge-pc`)**: Always Free `e2-micro`, Docker 기반 Python 10Hz 센서 연산 및 이상 탐지 데몬.
2. **Supabase 실시간 허브**: `marine_edge`(선박 버퍼) & `marine_control`(지상 관제) 이원화 스키마 + Realtime WebSocket.
3. **Cloudflare R2 아카이브**: 제로 이그레스(Zero Egress) 기반 24개월 선급 법정 Parquet 압축 저장소 & ENC 타일.
4. **Vercel 웹 & 엣지 프록시**: React 19 SPA 호스팅 + `/api/edge/*` 리버스 프록시(HTTPS 혼합 콘텐츠 방지 & 다운링크 제어).

* **상세 인프라 아키텍처**: [`docs/spec/maritime-cloud-edge-architecture.md`](./spec/maritime-cloud-edge-architecture.md)

---

## 4. 단계별 실행 로드맵 및 진행 순서 (Milestones)

| 스프린트 | 마일스톤 주제 | 핵심 산출물 및 범위 | 상태 |
|---|---|---|---|
| **Sprint 1** | **도메인 UX 규율 & 4대 직무 스토리보드** | • 선급 표준(KR, DNV, ABS) 도메인 학습서<br>• 해양 HMI 4대 핵심 규율 및 다크 테마<br>• 4대 역할별 사용자 여정 및 ASCII 와이어프레임 | **COMPLETED** (PR #2) |
| **Sprint 2** | **디자인 시스템 & 시각화 차트 CDD** | • 8대 시각화 제품군 & 14대 파라미터 매트릭스<br>• 원형 게이지, 5축 레이더, 위반 히트맵, GIS 맵<br>• 파나시아 HMI 장식용 애니메이션 지양 규율 반영 | **COMPLETED** (PR #4) |
| **Sprint 3** | **실측 오픈API 어댑터 & 실시간 파이프라인** | • 공공데이터(PORT-MIS) & AISStream 어댑터 (TDD)<br>• Supabase 이원화 스키마 DDL 배포 & Realtime<br>• Store-and-Forward 동기화 엔진 (`dualDbSyncEngine`)<br>• GCP 선박 엣지 데몬 컨테이너 배포<br>• 프론트엔드 실시간 웹소켓 연동 (`useTelemetryStream`) | **COMPLETED** (PR #6) |
| **Sprint 4** | **4대 직무 대시보드 조립 & 원격 제어** | • 기관사/관제사/감사관/진단원 4대 대시보드 통합<br>• Vercel 엣지 프록시(`/api/edge`) 다운링크 연결<br>• 비상 바이패스 밸브 및 위성 단절 인터랙티브 시연<br>• 텔레그램 실시간 장애 알림 연동 | **COMPLETED** (PR #10) |
| **Sprint 5** | **해양 디자인 시스템(MDS) 구축 & App Shell 라우터 아키텍처 및 순수 함수(SOLID) 리팩터링** | • 토스(TDS)/당근(Seed Design) 기반 3계층(Primitive/Semantic/Component) 디자인 토큰 체계<br>• 영속 App Shell(`MarineAppShell`) & 라우터 Outlet 구조 (10Hz 스트림 무중단 영속화)<br>• 데스크톱 상단 탭 ↔ 모바일 하단 바텀 네비게이션($\ge 44\text{px}$ 터치 타깃)<br>• Zustand 기반 고빈도 텔레메트리(`useTelemetryStore`) & 대시보드 상태(`useMarineDashboardStore`) 분리<br>• 순수 함수 컴포넌트(`React.memo`) & 4대 직무 시각화 매트릭스 완결 (`HeatmapChart`, `RadarChart`)<br>• 전 UI 컴포넌트 인라인 스타일 완전 제거 (`style={{ ... }}` 0개 달성) | **🚀 착수 (현재)** |
| **Sprint 6** | **종합 E2E 검증 & Cloudflare R2 아카이빙** | • 전 구간 통합 테스트 & Vitest 커버리지 극대화<br>• R2 일일 압축 Parquet 아카이브 연동<br>• 선급 감사관용 법정 PDF 리포트 발행 시연 | ⏳ 대기 |

---

## 5. Sprint 5 세부 진행 단계 (Sprint 5 Detailed Steps)

1. **[Step 1] 해양 디자인 시스템(MDS) 구축 & Tailwind 3-Layer 인프라**
   - 토스/당근 Seed Design 기반 3-Tier 디자인 토큰 확립 (`src/styles/tokens/`)
     - Primitive Tokens (원천 색상 팔레트)
     - Semantic Tokens (의미적 CSS 변수 매핑 `@layer base`)
     - Component Classes (`.marine-card`, `.marine-header`, `.marine-touch-target` 등 `@layer components`)
   - Preflight & 글로벌 리셋 (기본 8px 마진 제거, `box-sizing: border-box`, 탭 하이라이트 제거)
2. **[Step 2] 영속 App Shell & 라우터 Outlet 아키텍처 구축 (`MarineAppShell.tsx`)**
   - `react-router-dom` 설치 및 라우트 체계 구성 (`/`, `/gis`, `/reports`, `/alarms`)
   - 영속 관제 셸 구현: 글로벌 헤더(선박 칩, 직무 스위처), `ModeToggleBar`(CLOUD/EDGE, ONLINE/OFFLINE), 상태바
   - 반응형 네비게이션: 데스크톱 가로 탭 바 ↔ 모바일 고정 바텀 네비게이션 바(Bottom Nav Bar, $44\text{px}$)
   - 페이지 전환 시에도 10Hz GCP 센서 소켓 및 위성 통신 세션 무중단(Zero Disconnection) 보장
3. **[Step 3] Zustand 기반 상태관리 분리 및 모던 라이프사이클 구현 (SRP, DIP)**
   - `zustand` 설치 및 2-스토어 분격화:
     - `useTelemetryStore`: 10Hz 센서 스트림, 과도(Transient) 옵션 갱신(`store.subscribe`), 바이패스 밸브
     - `useMarineDashboardStore`: 4대 직무, 운영 모드, 네트워크 상태, 알람 큐 (`persist` 연동)
   - 파생 상태 인라인 계산($UI = f(State)$), `useEffect` 남용 제거, 이벤트 핸들러 중심 사용자 액션 처리
4. **[Step 4] 순수 함수 컴포넌트(`SensorDashboardView.tsx`) 및 4대 직무 위젯 레지스트리 (OCP, LSP, ISP)**
   - 렌더 단계 부수 효과 0, 순수 프레젠테이션 함수 구현 (`React.memo`)
   - `ROLE_WIDGET_COMPONENTS` 레지스트리를 통한 동적 위젯 확장 (if-else 분기 제거)
   - `COMPLIANCE_OFFICER` 직무에 `HeatmapChart`, `DIAGNOSTICIAN` 직무에 `RadarChart` 실데이터 바인딩
5. **[Step 5] 전 UI 컴포넌트 인라인 스타일 0개 달성 & 반응형 그리드 적용**
   - `SensorDashboard`, `ModeToggleBar`, `SensorCards`, `AlarmList`, `RoleSwitcher`, `MetricCard`, `AlertBadge` 내 인라인 `style={{ ... }}` 전면 제거
   - MDS 시맨틱 클래스 및 Tailwind 유틸리티 클래스로 100% 전환
6. **[Step 6] 2-Tier 테스트 검증 & review-army 코드 리뷰**
   - Tier 1: 단위/통합 테스트 (기존 55개 테스트 유지 및 AppShell, Zustand, 순수 뷰 테스트 추가)
   - Tier 2: Playwright 데스크톱 탭 전환 & 모바일(`375x667`) 바텀 네비게이션 터치 E2E 검증
   - `docs/scrum/sprint-5-report.md` & `sprint-5-slides.md` 발행 후 PR 머지 및 Vercel 배포
