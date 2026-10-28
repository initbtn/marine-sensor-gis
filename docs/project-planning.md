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
| **Sprint 6** | **Zero-PII 식별자 인증 & 실시간 활성 유저 통계 감사 및 R2 아카이빙** | • 개인정보(PII) 미수집/미저장 원칙 및 비가역 단방향 해시 식별자(`usr_****`) 세션 발급<br>• 실시간 동시 접속자 수 & 당일 DAU 통계 집계 및 직무별 분포 대시보드<br>• 식별자 기반 접속 감사 트레일 (`marine_control.access_audit_logs`) 구축<br>• 비상 바이패스 및 알람 인지 액션 감사 로그 자동 기록<br>• 24개월 선급 법정 데이터 Cloudflare R2 Parquet 압축 아카이브 & PDF 감사 보고서 연계<br>• GIS 침로 회전/항적 표출 및 평형수 탭 전환 결함 해결<br>• 종합 2-Tier 테스트(Vitest 82건 & Playwright E2E 10건) 완결 | **COMPLETED** (PR #15) |
| **Sprint 7** | **실시간 선박 항행 데드레커닝 시뮬레이션 & 동적 침로(COG/HDG) 16방위 연동** | • 선박 속력/방위 기반 위도/경도 실시간 항행 전진 계산 (`calculateDeadReckoningPosition`)<br>• 0~360° 방위각 16방위 나침반 라벨 변환 (`getCompassDirection16`)<br>• 스토어 선박 위치 전진 및 항적 실시간 누적 (최대 50포인트 링 버퍼)<br>• 대시보드 헤더 및 지도 마커 상단 영구 툴팁(`[195° SSW]`) 침로 표출<br>• 모바일 뷰포트 해양 GIS 범례(Legend) 접이식 토글 & 터치 최적화 (Issue #18, PR #19)<br>• 선박 마커 중심점 이중 앵커 오프셋 제거 & 대한해협(TSS) 서수로 실제 해상 항로 현실화 (Issue #22, PR #23)<br>• 종합 2-Tier 테스트(Vitest 92건 & Playwright E2E 12건) 완결 | **COMPLETED** (PR #17, PR #19, PR #23) |

---

## 7. Sprint 6 완료 내역 (Sprint 6 Outcomes)

1. **Zero-PII 해양 선급(IACS UR E26/E27) 인증 체계 구축**:
   - `js-sha256` 기반 솔트 해시 식별자(`usr_****`) 및 6대 선급/산업체 프리셋 1-클릭 인증 (`maritimeAuthService.ts`, `MaritimeAuthModal.tsx`)
   - 개인정보(이름, 이메일, 전화번호, 원본 IP) 1바이트 미수집 원칙 100% 충족
2. **실시간 활성 유저 통계 & 식별자 접속 감사 트레일 (`AuditDashboard.tsx`)**:
   - 실시간 동시 접속자 수(최근 5분), 당일 DAU, 시스템 조작 이벤트 카운터
   - `marine_control.access_audit_logs` DDL 마이그레이션 및 비상 바이패스/알람 인지 액션 자동 감사 로깅
3. **선급 법정 데이터 24개월 Cloudflare R2 아카이빙 & PDF 감사 서명 리포트 (`ComplianceReportPage.tsx`)**:
   - IMO MARPOL Annex VI MEPC.340(77) 법정 보존 패널 및 SHA-256 서명 리포트 출력
4. **GIS 선박 침로(Heading) 각도 회전 & 운항 항적 폴리라인 표출 결함 해결**:
   - IEC 62288 해양 전자해도 규격에 맞춘 선박 SVG 마커 각도 회전(`rotate`)
   - 전방 침로/속력 리더 벡터 및 출항지부터 현재 위치까지의 항적 폴리라인과 웨이포인트 렌더링
5. **5열 설비 패널: 평형수(BWTS) 탭 전환 연동 결함 해결**:
   - `SensorCards.tsx` 내 `activeFacility` 필터링 지원으로 평형수 탭 클릭 시 스크러버 카드가 숨겨지고 평형수 메트릭 4종이 즉시 최상단에 표출되도록 완결
6. **2-Tier 종합 검증 완결**:
   - Tier 1: Vitest 16개 파일 82/82개 단위 테스트 100% 통과
   - Tier 2: Playwright E2E 4개 파일 10/10개 브라우저 테스트 100% 통과
   - PR #15 `main` 브랜치 Squash 머지 (`e24aafc`) 및 GitHub Actions CI 성공 통과

---

## 8. Sprint 7 완료 내역 (Navigation Simulation & Dynamic COG/HDG Orientation)

1. **실시간 선박 항행 데드레커닝(Dead Reckoning) 계산 엔진 (`mockTelemetry.ts`)**:
   - 선박 속력(`speedKts`)과 방위각(`headingDeg`)을 바탕으로 경과 시간(`deltaSeconds`)에 따른 위도/경도 이동을 실시간 산출
   - 위도에 따른 경도 수렴 보정(`cos(lat)`) 및 극지방 예외 방지 수식 엄격 적용
2. **0~360° 방위각 16방위 변환기 (`getCompassDirection16`)**:
   - 각도를 16방위 나침반 라벨(N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW)로 자동 변환 (음수 및 360° 초과 정규화)
3. **전역 스토어 상태 관리 및 항적(Track) 실시간 누적 (`useMarineDashboardStore.ts`)**:
   - `advanceVesselPositions(deltaSeconds)` 액션을 통해 전 선박 위치를 전진시키고 이동 궤적을 항적 배열에 실시간 `push`
   - 장기 세션 메모리 누수 방지를 위해 선박당 최대 50개 좌표 링 버퍼(`slice(-50)`) 유지
4. **HMI 대시보드 및 해양 GIS 지도 상 침로/방위 동적 연동**:
   - `SensorDashboard.tsx`: 5초 주기 시뮬레이션 타이머에서 선박 위치 및 항적 갱신 트리거
   - `SensorDashboardView.tsx`: 상단 헤더에 `좌표` 및 `침로: 215° SW (18.4 kts)` 고대비 시각화
   - `MarineMap.tsx`: 선박 마커 상단에 `[215° SW]` 영구 툴팁(`permanent`) 렌더링, 팝업 침로 표기, 동적 항적 폴리라인 렌더링
   - `FullGisPage.tsx`: 전체 GIS 화면에 동적 `trackHistories` 연동
5. **2-Tier 종합 검증 완결**:
   - Tier 1: Vitest 17개 파일 89/89개 단위 테스트 100% 통과 (신규 `vesselNavigation.spec.ts` 7건 포함)
   - Tier 2: Playwright E2E 4개 파일 11/11개 브라우저 테스트 100% 통과 (신규 침로 방위 E2E 포함)
   - PR #17 `main` 브랜치 Squash 머지 (`a7c7882`) 및 GitHub Actions CI 성공 통과
6. **모바일 뷰포트 해양 GIS 범례(Legend) 접이식 토글 & 터치 타깃 최적화 (Issue #18, PR #19)**:
   - 모바일 화면(`< md`)에서 기본 축소(접힘) 상태 적용 및 컴팩트 토글 버튼(`[Layers] 범례 ▼`, $\ge 44\text{px}$ 터치 타깃) 제공
   - 열림 시 닫기(✕) 버튼 제공, 데스크톱(`md:`)에서는 기존처럼 상시 확장 표출
   - Tier 1: `tests/MarineMap.spec.tsx` 모바일 접이식 렌더링/토글 검증 추가 (총 90개 테스트 통과)
   - Tier 2: `e2e/gis-and-facility-toggle.spec.ts` 모바일 뷰포트(375x667) E2E 검증 추가 (총 12개 테스트 통과)
   - PR #19 `main` 브랜치 Squash 머지 (`4e743ab`) 및 Vercel 프로덕션 배포 완료
7. **해양 GIS 선박 마커 중심점 이격 버그 수정 및 부산항 외해 통항로(TSS) 해상 항행 현실화 (Issue #22, PR #23)**:
   - Leaflet `iconAnchor: [size/2, size/2]`와 내부 HTML `transform: translate(-50%, -50%)` 이중 앵커링 충돌을 제거하고 중심축 회전(`transform-origin: center center`)으로 마커와 항적 폴리라인 끝점/웨이포인트 서클 1:1 정밀 일치
   - `VSL-001(PANAMAX PIONEER)` 항로를 부산항 남외항 외해(`35.020, 129.080`) → 대한해협 서수로 통항분리대(`34.660, 129.050`)로 현실화하고 침로를 남동향(`195° SSW`)으로 설정하여 거제도 및 부산 도심 육상 침범 0건 달성
   - Tier 1: `tests/MarineMap.spec.tsx` 마커 옵션 검증 및 `tests/vesselNavigation.spec.ts` 100초 항행 바운더리 검증 추가 (총 92개 테스트 통과)
   - Tier 2: `e2e/gis-and-facility-toggle.spec.ts` 마커 스타일 및 `195° SSW` 방위 E2E 검증 (총 12개 테스트 통과)
   - PR #23 `main` 브랜치 Squash 머지 및 Vercel 프로덕션 배포 완료 (`https://marine-sensor-gis.vercel.app`)


8. **아키텍처 보안 규율 지침 반영: 단일 공개 WAS API 게이트웨이 경유 DB 접근 강제 및 스토리지 직접 쓰기 차단 명세화 (Issue #24, PR #25)**:
   - `docs/spec/maritime-cloud-edge-architecture.md`: 브라우저의 DB 직접 접근/자격증명 노출을 원천 차단하고 WAS 게이트웨이 단일 경유 원칙 명시, 클라이언트 스토리지 직접 쓰기(Presigned PUT) 금지 및 백엔드 Storage SDK 스트리밍 저장 규율 수립
   - `package.json` & `package-lock.json`: 프론트엔드 내 미사용 `@supabase/supabase-js` 및 전이 의존성 132줄 완전 제거로 번들 최적화 및 제로 자격증명 공격 표면 축소
   - `change-flow-adapter.md`: §5 거버넌스 항목에 아키텍처 보안 게이트웨이 및 스토리지 규율 행 추가
   - Tier 1: Vitest 17개 파일 92개 테스트 통과 / Tier 2: Playwright 12개 테스트 100% 통과
   - PR #25 `main` 브랜치 Squash 머지 (`9e36b4b`) 및 Vercel 프로덕션 배포 완료 (`https://marine-sensor-gis.vercel.app`)
