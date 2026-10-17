# Sprint 3 완료 보고서: 실측 오픈API 어댑터 및 4대 인프라 파이프라인 완성

## 1. 스프린트 개요
- **스프린트명**: Sprint 3 - 실측 오픈API 어댑터 및 선박 엣지-클라우드 실시간 데이터 파이프라인 구축
- **작업 브랜치**: `feat/sprint-3-data-pipeline`
- **연결 이슈**: Closes #5
- **담당자**: `@me`
- **검증 상태**: 9개 테스트 스위트 35/35 전체 통과 (Green), TypeScript strict 검사 0 errors, 프로덕션 빌드 성공

---

## 2. 4대 인프라 실측 배포 및 구현 결과

### ① GCP 선박 엣지 VM (`marine-edge-pc`)
- **스펙**: `e2-micro`, `us-central1-a`, 외부 IP: `34.133.74.29` (Always Free $0/월)
- **데몬 어플리케이션**: Python 3.11 + FastAPI + Docker 컨테이너
- **물리 모델**: IMO MEPC.340(77) Scrubber(SOx/CO2 ratio, 세정수 pH, 배출수 탁도, 차압) 및 BWM D-2 BWTS(필터 차압, UV 강도, TRO) 수학 시뮬레이터
- **다운링크 명령 인터페이스**:
  - `POST /command`: 비상 바이패스 밸브 트립(`BYPASS_TOGGLE`), 역세척 트리거(`BACKWASH_TRIGGER`), 위성 통신 단절(`SATELLITE_TOGGLE`)
- **실측 검증**: `curl -s http://34.133.74.29/health` 및 `/telemetry/latest` 0ms 지연 수신 확인

### ② Supabase Dual-DB & Realtime 허브
- **인프라**: `aws-0-ap-northeast-1.pooler.supabase.com:6543`, PostgreSQL 17.11 + PostGIS
- **마이그레이션**: `supabase/migrations/20261018000001_dual_schema_setup.sql`
  - `marine_edge`: `telemetry_buffer`, `sync_queue`, `active_alarms` (선박 버퍼링 전용)
  - `marine_control`: `vessels`, `telemetry_logs`, `compliance_events`, `eca_zones` (육상 관제 및 규제구역)
- **실시간 CDC**: `supabase_realtime` publication에 `marine_control.vessels`, `marine_control.telemetry_logs`, `marine_edge.active_alarms` 바인딩 완료

### ③ Store-and-Forward 동기화 엔진 (`dualDbSyncEngine.ts`)
- **IACS UR E27 / IMO MEPC.340(77) 규정 준수**: SHA-256 데이터 무결성 체크섬 생성 및 검증
- **위성 에어갭(Air-gap) 복원력**: 오프라인 상태 자동 버퍼링 및 위성 통신 복구 시 배치(Batch) 자동 플러시
- **TDD 검증**: 5개 단위 테스트 통과 (`tests/dualDbSyncEngine.spec.ts`)

### ④ 공공데이터 & 위성 AIS 어댑터 (`portMisService.ts`, `aisMessageAdapter.ts`)
- **해양수산부 PORT-MIS**: 부산항(`prtAgCd=020`) 실측 선박제원 및 운항정보 XML 파싱
- **글로벌 AISStream.io**: 위성 웹소켓 스트림 JSON 파싱, NMEA 자이로 고장 예외(`TrueHeading: 511 -> Cog`) 자동 보정
- **TDD 검증**: 7개 단위 테스트 통과 (`tests/portMisService.spec.ts`, `tests/aisMessageAdapter.spec.ts`)

### ⑤ Vercel 프론트엔드 연동 & 리버스 프록시 (`vercel.json`, `useTelemetryStream.ts`)
- **엣지 프록시**: `/api/edge/*` -> `http://34.133.74.29/*` 포워딩 (HTTPS Mixed Content 방지 및 CORS 해제)
- **리액트 훅**: `useTelemetryStream` (실시간 텔레메트리 폴링/스트리밍, 비상 바이패스/역세척/에어갭 원격 제어 토글)
- **TDD 검증**: 6개 단위 테스트 통과 (`tests/edgeControlClient.spec.ts`, `tests/useTelemetryStream.spec.ts`)

---

## 3. 테스트 및 빌드 매트릭스

| 테스트 스위트 | 테스트 수 | 통과 여부 | 비고 |
| :--- | :--- | :--- | :--- |
| `tests/telemetry.spec.ts` | 7 | PASS | 센서 도메인 모델 검증 |
| `tests/portMisService.spec.ts` | 3 | PASS | 해양수산부 공공데이터 파싱 검증 |
| `tests/aisMessageAdapter.spec.ts` | 4 | PASS | AISStream 위성 데이터 및 자이로 결함 보정 검증 |
| `tests/dualDbSyncEngine.spec.ts` | 5 | PASS | Store-and-Forward 및 SHA-256 무결성 검증 |
| `tests/edgeControlClient.spec.ts` | 3 | PASS | GCP 엣지 제어 클라이언트 통신 검증 |
| `tests/useTelemetryStream.spec.ts` | 3 | PASS | React 19 스트림 & 다운링크 제어 훅 검증 |
| `tests/Sprint2Components.spec.tsx` | 7 | PASS | HMI 대시보드 컴포넌트 검증 |
| `tests/AlarmList.spec.tsx` | 2 | PASS | IEC 62288 알람 리스트 검증 |
| `tests/SensorCards.spec.tsx` | 1 | PASS | 센서 카드 검증 |
| **합계** | **35** | **전체 PASS** | **0 failures** |

---

## 4. 완료 정의 (DoD) 체크리스트
- [x] 해양수산부 PORT-MIS 공공데이터 선박제원/입출항 어댑터 구현 및 TDD 통과
- [x] AISStream 글로벌 위성 AIS 어댑터 구현 및 TrueHeading 511 폴백 TDD 통과
- [x] Supabase Dual-DB (`marine_edge`, `marine_control`) 스키마 및 Realtime publication 마이그레이션
- [x] IACS UR E27 준수 Store-and-Forward 동기화 엔진 및 SHA-256 무결성 해시 구현
- [x] GCP VM (`marine-edge-pc`) 상에 Python 10Hz 물리 센서 데몬 배포 및 실측 엔드포인트 검증
- [x] Vercel `/api/edge/*` 리버스 프록시 및 React 19 `useTelemetryStream` 연동
- [x] `npm test` 35/35 통과 및 `npm run type-check` 0 에러
- [x] 프로덕션 번들 빌드 (`npm run build`) 정상 완료
