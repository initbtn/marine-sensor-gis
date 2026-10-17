# Marine Sensor GIS (EcoMarine Control Platform) PRD & IA Spec

> **Version**: 2.0.0 (Dual DB & Store-and-Forward Sync Engine Reflected)  
> **Repository**: [marine-sensor-gis](https://github.com/initbtn/marine-sensor-gis)  
> **Last Updated**: 2026-10-17  
> **Status**: APPROVED (Ready for Implementation)

---

## 1. 개요 및 목적 (Overview & Goals)

국제해사기구(IMO)의 해양 환경 규제 강화(MARPOL Annex VI 및 BWM Convention D-2)에 대응하여, 외항 선박에 탑재된 핵심 친환경 설비인 **탈황 설비(SOx Scrubber)**와 **선박 평형수 처리 설비(BWTS)**의 실시간 텔레메트리를 수집하고, **해양 GIS 관제 지도** 상에서 선박 위치·항적과 함께 통합 모니터링하는 웹 플랫폼입니다.

본 버전(v2.0)에서는 해상 위성 통신의 간헐적 단절(Intermittent Connectivity) 환경을 실제 산업 수준으로 반영하기 위해, **선박 에지 로컬 DB(Edge)**와 **내륙 클라우드 대용량 DB(Cloud)**를 2원화하고 오프라인 **Store-and-Forward 동기화 엔진**을 핵심 아키텍처로 도입합니다.

---

## 2. 시스템 아키텍처 (System Architecture)

```
                     [선박 실시간 설비 센서]
                                │ (1초 간격 Raw Telemetry)
                                ▼
        ┌────────────────────────────────────────────────┐
        │      1. 선박 로컬 에지 DB (Onboard Edge DB)       │
        │  - Supabase Local / Embedded SQLite Buffer     │
        │  - 0ms 무지연 선박 내부 실시간 관제                │
        │  - 최근 7~30일 롤링 버퍼 보관 (Auto-purge)         │
        └────────────────────────────────────────────────┘
                                │
                      [위성 연결 상태 감지]
                                │
             ┌──────────────────┴──────────────────┐
             │                                     │
       [Online 상태]                         [Offline 상태]
             │                                     │
             ▼                                     ▼
     Batch Sync Engine                      Local Queueing
  (100~500건 묶음 Gzip Upsert)          (sync_status = 'PENDING')
             │                                     │
             └──────────────────┬──────────────────┘
                                │ (네트워크 복구 시 재전송)
                                ▼
        ┌────────────────────────────────────────────────┐
        │       2. 내륙 대용량 DB (Inland Cloud DB)        │
        │  - Supabase Cloud (PostgreSQL + PostGIS)       │
        │  - 글로벌 운항 선박 통합 GIS 관제                  │
        │  - 1분 / 1시간 단위 집계 요약 적재                  │
        │  - IMO 법정 규제 위반 알람 스냅샷 장기 보관        │
        └────────────────────────────────────────────────┘
```

---

## 3. 2원화 데이터베이스 설계 (Dual DB Strategy)

### 3.1. 선박 에지 DB (Onboard Edge DB)
* **목적**: 선박 기관실 내부의 0ms 무지연 실시간 관제 및 위성 단절 시 버퍼링.
* **보관 정책**: 고주파(1초 간격) 원시 데이터를 수집하며 용량 한계를 위해 **최근 7일~30일**치만 유지하는 자율 순환 롤링 버퍼(Auto-purge).
* **핵심 테이블**:
  * `local_telemetry`:
    - `id`: UUID (Primary Key)
    - `vessel_id`: VARCHAR(32) (선박 고유 식별자)
    - `timestamp`: TIMESTAMPTZ (수집 시각)
    - `sox_ppm`: FLOAT (배기가스 SOx 농도)
    - `ph_inlet`: FLOAT (흡입수 pH)
    - `ph_discharge`: FLOAT (배출수 pH)
    - `turbidity_ftu`: FLOAT (탁도)
    - `bwts_flow_rate_m3h`: FLOAT (평형수 유량)
    - `bwts_tro_ppm`: FLOAT (잔류 산화물질 농도)
    - `sync_status`: VARCHAR(16) (`'PENDING'` | `'COMPLETED'`)

### 3.2. 내륙 대용량 클라우드 DB (Inland Cloud DB)
* **목적**: 전 세계 운항 선박의 통합 GIS 관제, 선단 효율 분석, IMO 법정 규제 준수 이력 관리.
* **보관 정책**: 네트워크 대역폭 및 클라우드 스토리지 최적화를 위해 **1분/1시간 단위 통계 집계 데이터**와 **규제 위반 순간의 Snapshot**만 영구 적재.
* **핵심 테이블**:
  * `vessels`: 선박 마스터 제원 및 PostGIS 기반 최종 위치 (`GEOGRAPHY(POINT, 4326)`)
  * `hourly_telemetry_summary`:
    - `vessel_id`, `hour_timestamp`, `avg_sox_ppm`, `max_sox_ppm`, `min_ph_discharge`, `avg_tro_ppm`, `total_washwater_m3`
  * `compliance_alarm_logs`:
    - `id`, `vessel_id`, `facility_type`, `level` (`'WARNING'` | `'CRITICAL'`), `code`, `message`, `timestamp`, `acknowledged`

---

## 4. 오프라인 Store-and-Forward 동기화 엔진 (Sync Engine)

위성 통신 단절(Offline) 및 복구(Online) 시나리오를 완벽하게 보장하는 파이프라인:

1. **상태 감지 (Network Status Sensing)**:
   - 브라우저 및 런타임의 `window.addEventListener('online' | 'offline')` 및 주기적 헬스체크 핑 프로브.
2. **오프라인 큐잉 (Store)**:
   - 통신 단절 시 발생하는 모든 센서 데이터는 로컬 에지 DB에 저장되고 `sync_status = 'PENDING'`으로 기록.
3. **재연결 배치 전송 (Forward & Batch Upsert)**:
   - 재연결 감지 시 `PENDING` 큐의 레코드를 100~500건 단위 청크로 분할하여 클라우드 DB로 일괄 업서트.
4. **멱등성 및 상태 갱신 (Idempotency)**:
   - 성공 응답 수신 시 로컬 레코드의 `sync_status`를 `'COMPLETED'`로 변경하여 네트워크 불안정에 의한 중복 전송 방지.

---

## 5. 프론트엔드 정보구조(IA) 및 화면 설계 (Information Architecture)

```
[EcoMarine GIS Control Platform]
 │
 ├── [Global Header]
 │    ├── 선박 셀렉터 (IMO 번호, 선명 검색 및 상태 뱃지)
 │    ├── 🚢 선박 에지 모드 ⇄ 🏢 내륙 클라우드 모드 토글 스위치
 │    ├── 위성 네트워크 상태 시뮬레이터 (Online ⇄ Offline 강제 토글)
 │    └── 동기화 큐 인디케이터 (대기 중 PENDING 건수 뱃지 & 동기화 상태)
 │
 ├── [Main Workspace - 2-Column Responsive Layout]
 │    │
 │    ├── [Left: GIS 해양 관제 맵 (Leaflet)]
 │    │    ├── 실시간 글로벌 선박 마커 (선속·침로 Heading 각도 반영 회전 렌더링)
 │    │    ├── 선박별 최근 실시간 항적 폴리라인 (Track Polyline)
 │    │    ├── 환경보호 규제 해역 (ECA - Emission Control Area) 오버레이 레이어
 │    │    └── 선박 상세 팝업 (선명, IMO, 선속, 침로, 현재 설비 상태)
 │    │
 │    └── [Right: 친환경 설비 관제 & 텔레메트리]
 │         ├── [설비 탭]: SOx Scrubber (배기가스 탈황) / BWTS (평형수 처리)
 │         ├── [KPI 센서 카드]:
 │         │    - 에지 모드: 1초 실시간 센서값 (Raw 수치 + 정상/주의/위험 상태)
 │         │    - 클라우드 모드: 1시간 평균값, 피크(Max)값, 규제 준수율(%)
 │         ├── [시계열 차트 (Apache ECharts)]:
 │         │    - 에지 모드: 초 단위 실시간 고주파 파형 (동적 스트리밍)
 │         │    - 클라우드 모드: 시간대별 집계 추세선 (Trend Area)
 │         │    - IMO 법정 허용 임계치 마크라인 (SOx 25ppm, pH 6.5, TRO 0.2ppm)
 │         └── [규제 준수 알람 콘솔 (Compliance Alarm Log)]:
 │              - 발생 일시, 설비 유형, 알람 등급 (CRITICAL / WARNING), 메시지
 │              - 기관사 확인(Acknowledge) 처리 및 해제 이력
 │
 └── [Footer / Status Bar]
      ├── 에지 롤링 버퍼 상태 (보관 일수, 용량 점유율)
      └── 마지막 동기화 성공 시각 (Last Sync Timestamp)
```

---

## 6. 구현 및 테스트 요구사항 (Acceptance Criteria)

1. **상태 관리 및 타입 정의**:
   - `OperatingMode`: `'EDGE'` | `'CLOUD'`
   - `NetworkStatus`: `'ONLINE'` | `'OFFLINE'`
   - `SyncStatus`: `'PENDING'` | `'COMPLETED'`
2. **동기화 엔진 서비스 모듈**:
   - `services/dualDbSyncEngine.ts`: 로컬 큐 관리, 오프라인 시 `PENDING` 누적, 온라인 복구 시 배치 동기화 시뮬레이션
3. **UI 컴포넌트 확장**:
   - `ModeToggleBar`: 에지/클라우드 전환 스위치, 네트워크 Online/Offline 토글 버튼, PENDING 큐 카운터 실시간 표시
   - `TelemetryChart`: 모드에 따른 초 단위 실시간 스트리밍(에지) vs 시간별 집계 추세(클라우드) 동적 렌더링
4. **품질 검증**:
   - Vitest 단위 테스트 100% 통과 유지 및 신규 동기화 엔진 테스트 케이스 추가.
