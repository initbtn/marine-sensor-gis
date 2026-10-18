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
| **Sprint 5** | **해양 디자인 시스템(MDS) 구축 & App Shell 라우터 아키텍처 및 순수 함수(SOLID) 리팩터링** | • 토스(TDS)/당근(Seed Design) 기반 3계층(Primitive/Semantic/Component) 디자인 토큰 체계<br>• 영속 App Shell(`MarineAppShell`) & 라우터 Outlet 구조 (10Hz 스트림 무중단 영속화)<br>• 데스크톱 상단 탭 ↔ 모바일 하단 바텀 네비게이션($\ge 44\text{px}$ 터치 타깃)<br>• Zustand 기반 고빈도 텔레메트리(`useTelemetryStore`) & 대시보드 상태(`useMarineDashboardStore`) 분리<br>• 순수 함수 컴포넌트(`React.memo`) & 4대 직무 시각화 매트릭스 완결 (`HeatmapChart`, `RadarChart`)<br>• 전 UI 컴포넌트 인라인 스타일 완전 제거 (`style={{ ... }}` 0개 달성)<br>• 해양 GIS 지도 동적 뷰포트 이동(`flyTo`) 및 전 선단 맞춤(`fitBounds`) | **COMPLETED** (PR #13) |
| **Sprint 6** | **Zero-PII 식별자 인증 & 실시간 활성 유저 통계 감사 및 R2 아카이빙** | • 개인정보(PII) 미수집/미저장 원칙 및 비가역 단방향 해시 식별자(`usr_****`) 세션 발급<br>• 실시간 동시 접속자 수 & 당일 DAU 통계 집계 및 직무별 분포 대시보드<br>• 식별자 기반 접속 감사 트레일 (`marine_control.access_audit_logs`) 구축<br>• 비상 바이패스 및 알람 인지 액션 감사 로그 자동 기록<br>• 24개월 선급 법정 데이터 Cloudflare R2 Parquet 압축 아카이브 & PDF 감사 보고서 연계<br>• 종합 2-Tier 테스트(Vitest 단위 & Playwright E2E) 완결 | **🚀 착수 (현재)** |

---

## 5. Sprint 5 완료 내역 (Sprint 5 Outcomes)

1. **해양 디자인 시스템(MDS) 구축 & Tailwind 3-Layer 체계 확립** (토스 TDS / 당근 Seed Design 토큰 모델 반영)
2. **영속 App Shell (`MarineAppShell.tsx`) & 라우터 Outlet 구축** (10Hz GCP 센서 웹소켓 무중단 유지)
3. **Zustand 2-스토어 분격화 & 모던 리액트 라이프사이클** ($UI = f(State)$, 리렌더링 폭풍 차단)
4. **순수 함수형 뷰(`SensorDashboardView.tsx`) & 4대 직무 위젯 레지스트리** (SOLID 5원칙 완결)
5. **전 애플리케이션 인라인 스타일 완전 제거 (`style={{ ... }}` 0개 달성)**
6. **해양 GIS 지도 동적 뷰포트 이동(`flyTo`) 및 전 선단 한눈에 보기(`fitBounds`) 구현 (Issue #12)**
7. **2-Tier 테스트 검증**: Vitest 66/66 전수 통과, Playwright 5/5 통과, Vercel 프로덕션 실배포 완료

---

## 6. Sprint 6 세부 진행 단계 (Sprint 6 Detailed Steps)

1. **[Step 1] Zero-PII 감사 로그 DDL 마이그레이션 (`supabase/migrations/`)**
   - `marine_control.access_audit_logs` 테이블 생성: `user_hash_id`, `assigned_role`, `action_type`, `target_path`, `session_duration_sec`, `created_at`
   - PII(이름, 이메일, 전화번호, 원본 IP) 컬럼 전면 배제 및 RLS(Row Level Security) 정책 적용
   - 실시간 활성 사용자(최근 5분) 및 당일 DAU 고속 집계 RPC 함수 작성
2. **[Step 2] 비가역 단방향 해시 식별자(`usr_****`) 및 2-Tier 인증 모듈 (`authService.ts`)**
   - `js-sha256` 기반 솔트 해시 식별자 생성 유틸리티 (`generateAnonymousUserId`)
   - 1-클릭 간편 게스트/모의 로그인(Tier 1 Mock) 및 Supabase Auth / 카카오 OIDC(Tier 2 Live) 통합
   - 일반 방문자(Guest)에게는 무인증 Zero-Friction 공개 접근 유지
3. **[Step 3] 실시간 활성 유저 통계 & 식별자 감사 트레일 대시보드 (`AuditDashboard.tsx`)**
   - 실시간 동시 접속자 수 카운터, 당일 DAU 집계 메트릭 카드
   - 개인정보 없는 식별자 감사 로그 테이블: `식별자 | 직무 | 수행 액션 | 경로 | 발생 시각`
   - 비상 바이패스 밸브 조작 및 크리티컬 알람 인지(Acknowledge) 시 감사 로그 실시간 자동 인서트
4. **[Step 4] App Shell 연동 및 권한 뱃지 표출 (`MarineAppShell.tsx`)**
   - 상단 헤더: `1-클릭 인증 버튼` ↔ `내 식별자 칩 (예: 🟢 usr_f4a1c9e8)` 상태 배선
   - 로그인된 사용자에게만 활성 유저 통계 및 상세 감사 패널 언락
5. **[Step 5] 선급 법정 리포트 연계 & Cloudflare R2 아카이빙**
   - 24개월 선급 법정 보존 데이터 R2 Parquet 압축 적재 파이프라인
   - 선급 감사관용 법정 검사 보고서 서명 PDF 1-클릭 생성 시연
6. **[Step 6] 2-Tier 테스트 검증 & review-army 코드 리뷰**
   - Tier 1: Vitest 단위 테스트 (해시 식별자 무결성, PII 미수집 검증, 통계 집계)
   - Tier 2: Playwright E2E 테스트 (로그인 시 식별자 칩 노출, 활성 통계 및 감사 로그 렌더링 검증)
   - PR 머지 및 Vercel 프로덕션 배포
