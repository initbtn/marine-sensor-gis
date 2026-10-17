# Sprint 3 발표 슬라이드: 실측 오픈API 어댑터 및 4대 인프라 파이프라인

---

<!-- slide -->
# 1. Sprint 3 미션 및 핵심 목표
- **과제명**: 친환경 선박 설비(Scrubber / BWTS) 및 해양 센서 GIS 관제 플랫폼
- **Sprint 3 목표**: 실측 오픈API 어댑터 및 선박 엣지-클라우드 실시간 데이터 파이프라인 구축
- **4대 인프라 배선**: GCP 선박 엣지 ➔ Supabase 실시간 허브 ➔ Cloudflare R2 ➔ Vercel 웹 대시보드

---

<!-- slide -->
# 2. 4대 인프라 아키텍처 및 역할 분담
- **GCP 선박 엣지 (`marine-edge-pc`)**: Python 3.11 + FastAPI + Docker (10Hz 물리 센서 엔진)
- **Supabase 허브**: Dual-DB (`marine_edge` 선박 버퍼, `marine_control` 육상 관제) + PostGIS + Realtime CDC
- **Cloudflare R2**: IMO MEPC.340(77) 24개월 법정 센서 로그 Parquet 보관 ($0 Egress)
- **Vercel 웹 & 프록시**: React 19 + TypeScript + ECharts 대시보드 & `/api/edge/*` CORS 해제 리버스 프록시

---

<!-- slide -->
# 3. 실측 오픈API & 위성 AIS 어댑터
- **해양수산부 PORT-MIS (`portMisService.ts`)**:
  - `http://apis.data.go.kr` 선박제원(`Info3`) 및 선박운항(`Info5`) 실측 연동
  - 부산항 입출항 선박 마스터 캐싱
- **글로벌 위성 AISStream (`aisMessageAdapter.ts`)**:
  - `wss://stream.aisstream.io` 실시간 위치 및 제원 파싱
  - **자이로 결함 보정**: `TrueHeading: 511` NMEA 예외치 발생 시 `Cog`(대지침로)로 자동 스냅 대체

---

<!-- slide -->
# 4. 선박-클라우드 Store-and-Forward 동기화 엔진
- **IACS UR E27 선급 사이버 복원력 표준 준수**:
  - 위성 통신 단절(Air-gap) 발생 시 선박 로컬 버퍼에 패킷 격리
  - 위성 링크 재연결 시 청크 단위 배치 자동 플러시
- **IMO MEPC.340(77) 위변조 방지**:
  - 전 패킷 대상 SHA-256 데이터 무결성 체크섬 자동 산출 및 첨부

---

<!-- slide -->
# 5. GCP 선박 엣지 데몬 실측 배포
- **호스팅**: GCP `e2-micro` (`us-central1-a`, Always Free 티어 $0/월)
- **배포 주소**: `http://34.133.74.29` (외부 인바운드 80/8000 개방)
- **양방향 제어**:
  - `GET /telemetry/latest`: 최신 10Hz 센서 수치 실측 수신
  - `POST /command`: 비상 스크러버 바이패스, 필터 역세척, 위성 단절 에어갭 토글

---

<!-- slide -->
# 6. 품질 검증 및 산출물 요약
- **단위/통합 테스트**: 9개 스위트 35/35 전원 PASS (Green)
- **정적 분석**: TypeScript strict 모드 0 컴파일 에러
- **프로덕션 번들**: Vite 빌드 최적화 완료
- **GitHub PR**: Closes #5
