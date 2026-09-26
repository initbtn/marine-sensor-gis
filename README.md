# Marine Sensor GIS (해양 친환경 설비 실시간 센서 모니터링 & GIS 관제 웹 플랫폼)

> **IMO 글로벌 환경 규제 대응 친환경 선박 설비(Scrubber / BWTS) 실시간 센서 텔레메트리 관제 대시보드**

[![CI Pipeline](https://github.com/initbtn/marine-sensor-gis/actions/workflows/ci.yml/badge.svg)](https://github.com/initbtn/marine-sensor-gis/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS-199900.svg)](https://leafletjs.com/)
[![ECharts](https://img.shields.io/badge/Apache-ECharts-aa344d.svg)](https://echarts.apache.org/)

---

## 1. 개요 (Overview)

국제해사기구(IMO)의 해양 환경 규제 강화에 대응하여, 외항 선박에 탑재된 핵심 친환경 설비인 **탈황 설비(SOx Scrubber)** 및 **선박 평형수 처리 설비(BWTS)**의 실시간 센서 텔레메트리를 수집하고, **해양 GIS 지도** 상에서 선박 위치·항적과 함께 통합 관제하는 모던 웹 플랫폼입니다.

### 적용 환경 규제 및 감시 지표
1. **IMO MARPOL Annex VI (선박 배기가스 황산화물 저감 규제)**
   - 배기가스 SOx 농도 (기준: 25 ppm 미만 감시)
   - 세정수 흡입/배출 산성도 (배출수 pH $\ge$ 6.5 규제 감시)
   - 배출수 탁도 (Turbidity < 25 FTU 감시)
2. **IMO BWM Convention (선박 평형수 처리 D-2 규정)**
   - 평형수 주입/배출 유량 (m³/h)
   - 살균 소독 잔류 산화물(TRO, Total Residual Oxidant < 0.2 ppm 감시)
   - 자동 역세척(Backwashing) 제어를 위한 여과기 차압 (kPa)

---

## 2. 주요 기능 (Key Features)

- 🗺️ **실시간 해양 GIS 관제 (Leaflet GIS)**
  - 글로벌 해역 내 선박 위치 및 선수 침로(Heading) 실시간 회전 마커 렌더링
  - 선박별 실시간 항적(Track Polyline) 및 상세 제원 팝업 표시
- 📈 **시계열 센서 차트 (Apache ECharts)**
  - Scrubber / BWTS 설비별 다축(Multi-axis) 실시간 시계열 그래프
  - IMO 법정 허용 임계치 마크라인(MarkLine) 자동 오버레이
- ⚡ **실시간 텔레메트리 & 경보 인디케이터**
  - 센서 이상치 및 환경 규제 위반 즉시 감지 (CRITICAL / WARNING 알람)
  - 운영자 확인(Acknowledge) 처리 및 이력 관리
- 🧪 **견고한 TDD 테스트 파이프라인 (Vitest & Testing Library)**
  - 도메인 텔레메트리 생성기 및 알람 평가 로직 100% 단위 테스트 커버

---

## 3. 기술 스택 (Tech Stack)

| 영역 | 스택 |
|---|---|
| **Core Framework** | React 18, TypeScript, Vite |
| **GIS & Mapping** | Leaflet, React-Leaflet |
| **Data Visualization** | Apache ECharts, echarts-for-react |
| **Icons & UI** | Lucide React |
| **Testing & CI** | Vitest, JSDOM, Testing Library, GitHub Actions |

---

## 4. 로컬 실행 및 빌드 (Getting Started)

### 의존성 설치
```bash
npm install
```

### 로컬 개발 서버 기동
```bash
npm run dev
```

### 테스트 실행 (Vitest)
```bash
npm run test
```

### 프로덕션 빌드 & 타입 검사
```bash
npm run type-check
npm run build
```

---

## 5. 프로젝트 거버넌스

- domstack 거버넌스 및 실행 규율은 [`change-flow-adapter.md`](./change-flow-adapter.md)에 기술되어 있습니다.
