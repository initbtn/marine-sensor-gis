# 해양 엣지-클라우드 4대 인프라 아키텍처 명세서 (Maritime Cloud-Edge Architecture)

이 문서는 파나시아(PANASIA) 친환경 설비(PaSOx Scrubber / GloEn-Patrol BWTS) 및 해양 센서 GIS 관제 플랫폼의 **4대 인프라(GCP 엣지, Supabase 허브, Cloudflare R2 아카이브, Vercel 프록시/웹)** 통합 설계와 양방향 데이터 배선 흐름을 규정한 정본 아키텍처 문서입니다.

---

## 1. 4대 인프라 구성 요약

```
[1. GCP 선박 엣지 VM] ──(위성 Store-and-Forward)──► [2. Supabase 실시간 허브]
  (us-central1 Always Free)                              (PostgreSQL + Realtime)
        │▲                                                         │▲
        ││ (원격 제어 다운링크)                                      ││ (실시간 웹소켓 업링크)
        ▼│                                                         ▼│
[4. Vercel 엣지 프록시 & UI] ◄─────────────── (대용량 전자해도/아카이브) ── [3. Cloudflare R2]
  (React 19 + ECharts)                                      (Zero-Egress Object Storage)
```

| 인프라 구분 | 호스팅 및 환경 | 핵심 역할 및 담당 기능 | 비용/티어 최적화 |
| :--- | :--- | :--- | :--- |
| **① 선박 엣지 컴퓨터** | **Google Cloud Platform (GCP)**<br>`marine-edge-pc` (us-central1-a, e2-micro, Docker) | • 10Hz 센서 스트림 발생기 (PaSOx / GloEn-Patrol)<br>• Polars 롤링 윈도우 집계 & 칼만 필터 노이즈 정류<br>• ONNX 경량 이상 탐지 추론 (진동/차압 이상)<br>• Store-and-Forward 로컬 버퍼링 & 위성 단절 시뮬레이션 | **$0 / 월** (Always Free Tier) |
| **② 데이터 & 웹소켓 허브** | **Supabase (PostgreSQL 16)**<br>`sgyhpiyfznlwsdujeyah.supabase.co` | • `marine_edge`: 선박 텔레메트리 버퍼 및 대기열<br>• `marine_control`: 육상 관제 선단 마스터 & 집계 로그<br>• PostGIS: 배출규제해역(ECA) 경계 공간 연산 (`ST_Contains`)<br>• Realtime WebSocket: DB 변경 감지(CDC) 및 브로드캐스트 | **무료 티어** (지상 전용 서버리스 운영) |
| **③ 제로 이그레스 아카이브** | **Cloudflare R2**<br>(S3-compatible Object Storage) | • IMO / 선급(KR, DNV) 법정 의무 24개월 센서 로그 (Parquet 압축)<br>• 전자해상기록부(ERB) 및 선급 검사 보고서 서명 PDF 보관<br>• 전 세계 배출규제해역(ECA) 및 해양 전자해도(ENC) 벡터 타일 서빙<br>• 엣지 추론용 머신러닝 모델 가중치 파일 (`model.onnx`) 배포 | **$0 트래픽 비용** (Zero Egress Fee) |
| **④ 프론트엔드 & 엣지 프록시** | **Vercel**<br>`jsconn/marine-sensor-gis` | • React 19 + TypeScript + Apache ECharts + Leaflet GIS 대시보드<br>• `/api/edge/*`: HTTPS 혼합 콘텐츠 방지 및 CORS 리버스 프록시<br>• 다운링크: 비상 바이패스 밸브 트립, 역세척 명령, 위성 단절 토글 | **Hobby 무상 티어** |

---

## 2. 세부 통신 데이터 파이프라인 (Data Pipeline Flows)

### 🌊 Flow A. 실시간 센서 텔레메트리 업링크 (Uplink: Ship ➔ Cloud ➔ UI)
1. **10Hz 센서 수집 (GCP 엣지)**:
   - Scrubber 타워 차압, 세정수 pH, 배출수 탁도, PAH, CEMS SO₂/CO₂ 농도, BWTS 필터 차압, UV 강도 등을 100ms 주기로 생성.
2. **엣지 전처리 및 1차 이상 판정**:
   - `Polars`로 1초 평균값 계산 및 IMO MEPC.340(77) 기준(SOx ECA 4.3ppm, Global 21.7ppm) 초과 여부 즉시 판정.
   - `ONNX Runtime`으로 5축 건전성 지표(파나시아 판호크) 추론.
3. **선박 버퍼링 및 위성 동기화**:
   - 1차 집계 데이터를 `marine_edge.telemetry_buffer`에 기록 (`status = 'PENDING'`).
   - 위성 네트워크가 정상이면 지상 관제 테이블 `marine_control.telemetry_logs`로 전송 후 `status = 'SYNCED'` 갱신.
4. **Supabase Realtime 웹소켓 브로드캐스트**:
   - `marine_control.telemetry_logs`에 INSERT 발생 시 Supabase Realtime이 이를 감지하여 프론트엔드로 웹소켓 푸시.
   - Vercel의 React 대시보드에서 0ms 지연으로 원형 게이지 및 시계열 차트 갱신.

---

### 🕹️ Flow B. 원격 제어 및 시뮬레이션 다운링크 (Downlink: UI ➔ Edge Proxy ➔ Ship)
1. **사용자 인터랙션 (React UI)**:
   - 기관사/관제사가 UI에서 `[비상 스크러버 바이패스]`, `[필터 역세척 강제 트리거]`, 또는 `[🛰️ 위성 통신 단절 시뮬레이션]` 클릭.
2. **Vercel 엣지 프록시 (`/api/edge/*`)**:
   - 브라우저는 Vercel의 HTTPS 엔드포인트로 POST 요청.
   - Vercel 프록시가 GCP 선박 엣지 VM(`http://34.133.74.29:8000/command`)으로 내부 포워딩.
3. **선박 엣지 명령 실행**:
   - GCP 엣지 데몬이 명령을 수신하여 밸브 상태를 전환하거나, 위성 전송 루프를 일시 중지(오프라인 버퍼링 모드 진입).

---

### 📦 Flow C. 법정 선급 감사 및 장기 데이터 아카이빙 (Cold Storage: Cloud ➔ R2)
1. **일일 배치 압축 (Daily Archive)**:
   - 매일 자정(00:00 UTC), Supabase의 24시간 센서 데이터를 Parquet 포맷으로 압축(기존 크기의 10% 수준).
2. **Cloudflare R2 영구 보관**:
   - S3 API를 통해 `s3://marine-sensor-archives/YYYY-MM/vessel_IMO_YYYYMMDD.parquet` 경로로 업로드.
   - IMO MEPC.340(77) 규정에 따른 **24개월 법정 의무 보관 주기 충족**.
3. **전자해도(ENC) 및 모델 배포**:
   - 전 세계 ECA 폴리곤 및 전자해도 벡터 타일을 R2 버킷에 탑재하여 전 세계 엣지 CDN 서빙.

---

## 3. 사이버 보안 및 선급 복원력 표준 (IACS UR E26/E27 준수)

* **IACS UR E26 (Cyber Resilience of Ships)**:
  - 선박 엣지 컴퓨터 내의 파이썬 분석 모듈은 Docker 컨테이너로 격리되어 독립된 cgroup 자원 상한(`--cpus=1.0 --memory=1g`) 내에서 구동되며, 필수 항해 통신망(NMEA)을 보호합니다.
* **IACS UR E27 (Cyber Resilience of On-board Systems and Equipment)**:
  - 위성 통신 단절(Air-gap) 발생 시에도 선박 내부 HMI는 외부 클라우드 의존성 없이 100% 정상 작동합니다.
  - 전송되는 모든 텔레메트리 패킷은 SHA-256 해시 무결성 검증 필드(`dataIntegrityHash`)를 동봉하여 위변조를 방지합니다.
