# EcoMarine GIS 프론트엔드 스토리보드 및 UI/UX 상세 기획 명세서 (Front Spec)

> **문서 상태**: APPROVED (Sprint 1 정본 산출물)  
> **대상 플랫폼**: EcoMarine Control Platform (`marine-sensor-gis`)  
> **버전**: v1.0.0

---

## 1. 4대 운영 직무별 페르소나 및 사용자 여정 (User Journeys)

### 1.1. [Role 1] 🚢 선박 기관사 (Chief Engineer - Onboard Edge)
- **사용자**: 1등/책임기관사 (선박 기관실 현장 근무)
- **주요 목적**: 0ms 무지연 계측, 탈황/평형수 장비의 기계적 이상 실시간 감지 및 알람 즉각 조치.
- **핵심 시나리오**:
  1. 기관실 태블릿/모니터에서 PaSOx 스크러버와 GloEn-Patrol BWTS 상태를 동시 모니터링.
  2. 세정수 배출구 pH가 6.5 미만으로 급락하면 상단 앰버 경보 점멸과 함께 원형 게이지가 위험 밴드로 진입.
  3. 기관사는 화면의 `[ACKNOWLEDGE]` 버튼을 원클릭하여 알람 인지 처리 후 NaOH(가성소다) 중화 밸브 수동 개방.
  4. 위성 단절 시 로컬 에지 큐에 데이터가 안전하게 누적(`PENDING`)되는 것을 확인.

### 1.2. [Role 2] 🏢 육상 선단 관제관 (Fleet Operator - Inland Control Room)
- **사용자**: 선사(해운사) 육상 운항관리팀 해사감독관 (부산 본사 관제센터)
- **주요 목적**: 전 세계 대양을 운항 중인 전 선박의 위치, 침로, 친환경 설비 가동 상태 및 ECA 규제 해역 진입 여부 총괄 관제.
- **핵심 시나리오**:
  1. 전면 해양 GIS 지도에서 부산-로테르담 항로를 운항 중인 선단(10척)의 실시간 위치와 침로(Heading)를 확인.
  2. 북해(North Sea) ECA 규제 해역으로 진입 중인 선박을 클릭하여 줌인.
  3. 선단 전체 가동 상태 도넛 차트에서 정상 가동 8척, 주의 1척, 규제 초과 1척 분포를 파악하고 해당 선박 기관실로 위성 통신 지시 전달.

### 1.3. [Role 3] ⚖️ 환경규제 감사관 (Compliance Officer - IMO / Class Auditor)
- **사용자**: 한국선급(KR) 또는 DNV 검사관, 항만국통제(PSC) 검사관, 사내 환경감사팀
- **주요 목적**: 법정 환경 규제(MARPOL Annex VI, BWM D-2) 준수율 증빙 및 위반 이력 감사 리포트 출력.
- **핵심 시나리오**:
  1. 당월 IMO 법적 종합 준수율 게이지(99.6%)를 확인.
  2. 시간대별 위반 매트릭스 히트맵에서 특정 항구 입항 전 배출수 pH 이상 빈도 검토.
  3. **선급 공인 전자 기록부(Electronic Record Book)** 탭에서 위성 동기화로 검증된 시간별 타임스탬프 원본 데이터를 검토하고 `[CSV 다운로드]`로 법정 감사 증빙 파일 추출.

### 1.4. [Role 4] 🔧 원격 진단 엔지니어 (Pan-Hawk Diagnostic Tech)
- **사용자**: 파나시아 고객지원센터/원격진단팀 엔지니어 (Pan-Hawk 플랫폼)
- **주요 목적**: 부품 수명 및 센서 드리프트를 사전 진단하여 선박 입항 전 비대면 A/S 및 소모품 발주 지원.
- **핵심 시나리오**:
  1. 5개 축 설비 건전성 레이더 차트(CEMS 정밀도, 필터 차압 여유, UV 램프 수명, 펌프 효율, 중화제 안정도)를 분석.
  2. 평형수 유량 대비 필터 차압 상관관계 산점도(Scatter)에서 역세척 주기가 비정상적으로 잦아지는 조기 징후 발견.
  3. 예지보전 타임라인에서 "UV 램프 교체 권장 D-14일" 알림을 확인하고 선주사에 교체 부품 사전 배송 발주 등록.

---

## 2. 직무별 대시보드 와이어프레임 (Wireframes)

### 2.1. [화면 1] 선박 기관사 뷰 와이어프레임 (Chief Engineer Layout)
```
+-----------------------------------------------------------------------------------------------+
| [EcoMarine GIS] 🚢 선박: [PANASIA PIONEER v]  [모드: 🚢에지] [위성: ●ONLINE] [큐: 0건]  [🔔 알람 0] |
| [직무 전환: [🚢선박 기관사 v]]  [설비 탭: [PaSOx 스크러버] [GloEn-Patrol BWTS]]                |
+---------------------------------------------------------------+-------------------------------+
|  [P&ID 실시간 공정 흐름 미믹 패널]                            |  [IMO 규제 절대 임계치 게이지] |
|  배기가스 인입 ──► [스크러버 타워] ──► 세정수 분사 ──► 선외배출 |  +-------------------------+  |
|  - 엔진부하: 82%     - 차압: 1.2kPa   - 펌프: 450 m³/h       |  |  SOx 배출가스 농도 (ppm)   |  |
|  - 온도: 285°C      - 타워온도: 42°C  - 중화제: 12 L/h       |  |   [   1.8 ppm  (ECA)   ]   |  |
|                                                               |  |   (정상: 0~4.3 / 한계선)    |  |
|  [초 단위 고주파 실시간 펄스 파형 (1초 Multi-axis Line)]      |  +-------------------------+  |
|  ppm / pH                                                     |  |  세정수 배출구 산성도 (pH)  |  |
|   |         /\  SOx ppm (1.8)                                 |  |   [     7.4 pH          ]   |  |
|   |--------/--\-------------------------------- 4.3ppm 한계   |  |   (안전선: 6.5 이상)        |  |
|   | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ pH (7.4)                 |  +-------------------------+  |
|   +--------------------------------------------> Time (0ms)   |  [실시간 알람 인지 콘솔]       |
|                                                               |  • 22:04 [CRITICAL] pH < 6.5  |
|  [에지 롤링 버퍼 상태]: 7일 보관 중 (총 604,800건 / 0.12GB)    |    [즉시 인지(Acknowledge)]   |
+---------------------------------------------------------------+-------------------------------+
```

### 2.2. [화면 2] 육상 선단 관제관 뷰 와이어프레임 (Fleet Operator Layout)
```
+-----------------------------------------------------------------------------------------------+
| [EcoMarine GIS] 🏢 전 선단(10척) 총괄 관제  [모드: 🏢클라우드] [위성망: 정상]           [선단 요약] |
| [직무 전환: [🏢육상 관제관 v]]  [해역 필터: [글로벌] [ECA 규제해역 v]]                          |
+---------------------------------------------------------------+-------------------------------+
|  [전면 확장 Leaflet 해양 GIS 관제 지도]                       |  [선단 가동 상태 도넛 차트]    |
|  +---------------------------------------------------------+  |  +-------------------------+  |
|  |  [ECA 북해 경계선 오버레이 (황색 점선)]                  |  |  |  ● 정상 가동 (8척)       |  |
|  |       ▲ PIONEER (침로: 045°, 14.2kt)                     |  |  |  ▲ 경고/주의 (1척)       |  |
|  |      / \  ~~~~ 실시간 24h 이동 항적(Track)              |  |  |  ■ 규제 초과 (1척)       |  |
|  |     /                                                   |  |  +-------------------------+  |
|  |                                                         |  |  [선단 배출량 누적 막대]      |
|  |         ▲ VOYAGER (대한해협 통항 중)                     |  |  선박별 일일 세정수 배출량  |
|  +---------------------------------------------------------+  |  PIONEER [========   ] 420t   |
|  [선택 선박 정보 팝업 카드]                                    |  VOYAGER [========== ] 580t   |
|  • 선명: PANASIA PIONEER (IMO 9841234) | 상태: 정상 운항      |  PACIFIC [======     ] 310t   |
+---------------------------------------------------------------+-------------------------------+
```

### 2.3. [화면 3] 규제 감사관 뷰 와이어프레임 (Compliance Officer Layout)
```
+-----------------------------------------------------------------------------------------------+
| [EcoMarine GIS] ⚖️ 환경 규제 감사 대시보드  [대상: IMO MARPOL VI & BWM D-2]    [선급: DNV/KR]   |
| [직무 전환: [⚖️규제 감사관 v]]  [조회 기간: [2026-10 (당월) v]]  [내보내기: [📥 CSV 다운로드]]  |
+---------------------------------------------------------------+-------------------------------+
|  [IMO 종합 법적 준수율 게이지 (%)]                            |  [선급 공인 전자 기록부 테이블] |
|  +---------------------------------------------------------+  |  (MARPOL Electronic Logbook)  |
|  |                당월 종합 환경 준수율                     |  |  Timestamp | SOx | pH | 결함 |
|  |                     99.64 %                             |  |  22:00:00  | 1.8 | 7.4| NORMAL|
|  |          (선급 요구 기준 99.50% 달성 PASS)              |  |  21:00:00  | 1.9 | 7.3| NORMAL|
|  +---------------------------------------------------------+  |  20:00:00  | 4.4 | 6.4| TRIP! |
|  [시간대/요일별 위반 발생 히트맵 매트릭스 (Heatmap)]           |                               |
|       월  화  수  목  금  토  일                              |  [선급 검사관 서명 검증 상태]  |
|  00시 [ ][ ][ ][ ][ ][ ][ ]                                   |  • 기국: 대한민국 (KR 검사필) |
|  06시 [ ][!][ ][ ][ ][ ][ ]  (!: 입항 전 일시 pH 저하 패턴)  |  • 무결성 해시: SHA-256 Valid |
|  12시 [ ][ ][ ][ ][ ][ ][ ]                                   |  • 데이터 위변조 방지: OK     |
+---------------------------------------------------------------+-------------------------------+
```

### 2.4. [화면 4] 원격 진단원 뷰 와이어프레임 (Diagnostic Tech Layout)
```
+-----------------------------------------------------------------------------------------------+
| [EcoMarine GIS] 🔧 판호크 원격 예지보전 센터  [선박: PANASIA PIONEER]       [서비스: Pan-Hawk] |
| [직무 전환: [🔧원격 진단원 v]]  [진단 모듈: [PaSOx] [GloEn-Patrol v]]                          |
+---------------------------------------------------------------+-------------------------------+
|  [5축 설비 건전성 레이더 차트 (Equipment Health Radar)]       |  [유량 vs 필터 차압 상관 산점도]|
|                       CEMS 센서 신뢰도(96)                    |  차압(bar)                    |
|                              /\                               |  1.5|           * 경보 임계치 |
|      중화제 안정도(90)     /    \    필터차압 여유(65)        |  1.0|      * * *  역세척 임계치|
|                         \        /                            |  0.5|  * * * * (정상 운전선)  |
|                          \      /                             |     +-------------------->    |
|               펌프 효율(92) \  / UV 램프 잔여수명(78)         |     0    500   1000 유량(m3/h)|
|                                                               |  [예지보전 타임라인 & 권고]   |
|  [진단 결과 요약]: 종합 헬스 스코어 84.2점 (양호)              |  • [D-14] UV 램프 교체 권장   |
|  - 주의: 여과기 차압 상승 속도가 표준 대비 18% 빠름(점검 요망) |  • [D-45] pH 센서 교정 권장   |
+---------------------------------------------------------------+-------------------------------+
```

---

## 3. 프론트엔드 데이터 계약 (TypeScript Data Contracts)

```typescript
// 1. 운영 모드 및 4대 직무 계정 정의
export type OperatingMode = 'EDGE' | 'CLOUD';
export type UserRole = 
  | 'CHIEF_ENGINEER'      // 🚢 선박 기관사
  | 'FLEET_OPERATOR'     // 🏢 육상 관제관
  | 'COMPLIANCE_OFFICER'  // ⚖️ 규제 감사관
  | 'DIAGNOSTIC_TECH';    // 🔧 원격 진단원

// 2. 선박 고주파 1초 텔레메트리 원시 레코드 (Edge Local Buffer)
export interface RawTelemetryRecord {
  id: string;
  vesselId: string;
  recordedAt: string;     // ISO-8601 UTC
  syncStatus: 'PENDING' | 'COMPLETED';
  
  // PaSOx Scrubber 메트릭 (IMO MARPOL Annex VI)
  soxPpm: number;         // ECA: <= 4.3 ppm, Global: <= 21.7 ppm
  so2Co2Ratio: number;
  washwaterPh: number;    // Standard: >= 6.5
  turbidityNtu: number;   // Standard: <= 25 NTU
  washwaterFlowM3h: number;
  scrubberDeltaPkPa: number;
  
  // GloEn-Patrol BWTS 메트릭 (IMO BWM D-2)
  ballastFlowM3h: number;
  filterDeltaPBar: number;// Normal: 0.2~0.8, Backwash: >=1.0, Alarm: >=1.5
  uvIntensityWm2: number; // Minimum: >= 250 W/m2
  troPpm: number;         // Neutralization: <= 0.1 ppm
  operationMode: 'BALLASTING' | 'DEBALLASTING' | 'IDLE';
}

// 3. 육상 클라우드 1시간 통계 요약 (Control Aggregation)
export interface HourlySummaryRecord {
  id: string;
  vesselId: string;
  windowStartTime: string;
  avgSoxPpm: number;
  maxSoxPpm: number;
  avgWashwaterPh: number;
  minWashwaterPh: number;
  totalWashwaterDischargeM3: number;
  totalBallastTreatedM3: number;
  violationCount: number;
  complianceRatePercent: number; // 목표 >= 99.5%
}

// 4. 선급 및 법정 알람 수명주기 모델 (ISA-18.2 표준)
export interface ComplianceAlarm {
  id: string;
  vesselId: string;
  ruleCode: 'MARPOL_ANNEX_VI' | 'BWM_D2' | 'EQUIPMENT_FAULT';
  severity: 'WARNING' | 'CRITICAL';
  status: 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'CLEARED';
  message: string;
  triggerValue: number;
  thresholdValue: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// 5. 판호크 예지보전 5축 설비 건전성 스코어 (0~100점)
export interface EquipmentHealthScore {
  vesselId: string;
  evaluatedAt: string;
  overallScore: number;
  cemsSensorReliability: number; // 0~100
  filterDpMargin: number;        // 0~100
  uvLampLifespan: number;        // 0~100
  pumpEfficiency: number;        // 0~100
  neutralizerStability: number;  // 0~100
  recommendations: Array<{
    targetPart: string;
    actionRequired: string;
    dueDays: number;
  }>;
}

// 6. 선박 AIS 항행 정보 (AISStream.io 및 시뮬레이터 공용)
export interface AisVesselPosition {
  vesselId: string;
  mmsi: number;
  imoNumber: number;
  vesselName: string;
  latitude: number;
  longitude: number;
  headingDeg: number;     // 0~359 침로각
  sogKnots: number;       // 속력
  inEcaZone: boolean;     // ECA 규제해역 진입 여부
  lastReportedAt: string;
}
```
