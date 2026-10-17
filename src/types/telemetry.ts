/**
 * 해양 친환경 설비(PaSOx Scrubber / GloEn-Patrol BWTS) 및 선박 텔레메트리 도메인 인터페이스
 * IMO MARPOL Annex VI, IMO BWM D-2, IACS UR E26/E27 준수
 */

export type FacilityType = 'SCRUBBER' | 'BWTS';
export type AlarmLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type VesselStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

// 4대 운영 직무 및 동작 모드
export type OperatingMode = 'EDGE' | 'CLOUD';
export type UserRole = 
  | 'CHIEF_ENGINEER'      // 🚢 선박 기관사 (Onboard Edge)
  | 'FLEET_OPERATOR'     // 🏢 육상 관제관 (Inland Control Room)
  | 'COMPLIANCE_OFFICER'  // ⚖️ 규제 감사관 (IMO/Class Auditor)
  | 'DIAGNOSTIC_TECH';    // 🔧 원격 진단원 (Pan-Hawk Diagnostic Tech)

export interface Position {
  lat: number;
  lng: number;
}

export interface VesselInfo {
  id: string;
  name: string;
  imoNumber: string;
  callSign: string;
  vesselType: string;
  flag: string;
  position: Position;
  speedKts: number;
  headingDeg: number;
  destination: string;
  eta: string;
  status: VesselStatus;
}

/**
 * 탈황 설비(SOx Scrubber) 실시간 센서 텔레메트리 (IMO MARPOL Annex VI 준수 관제)
 */
export interface ScrubberTelemetry {
  timestamp: string;
  soxPpm: number;           // 배기가스 SOx 농도 (ppm, 일반: < 21.7ppm, ECA: < 4.3ppm)
  co2Percent: number;       // 배기가스 CO2 비율 (%)
  so2Co2Ratio: number;      // SO2/CO2 비율 (IMO 규제 기준: 4.3 이하 @ 0.1% S)
  phInlet: number;          // 흡입 해수 pH
  phDischarge: number;      // 배출수 pH (선외 배출 시 pH >= 6.5 강제 감시)
  washwaterFlowM3h: number; // 세정수 공급 유량 (m³/h)
  turbidityFtu: number;     // 배출수 탁도 (FTU/NTU, 기준 < 25 NTU)
  pahPpb: number;           // 다환방향족탄화수소(PAH) 농도 (ppb, 기준 < 50 ppb)
  pressureDropKpa: number;  // 스크러버 차압 (kPa)
}

/**
 * 선박 평형수 처리 설비(BWTS - Ballast Water Treatment System) 실시간 센서 (IMO D-2 / USCG)
 */
export interface BWTSTelemetry {
  timestamp: string;
  flowRateM3h: number;      // 평형수 처리 유량 (m³/h)
  troPpm: number;           // 잔류 산화물질 농도 (Total Residual Oxidant, ppm, 기준 < 0.1 ppm)
  filterPressureKpa: number;// 여과기 차압 (kPa)
  filterDeltaPBar?: number; // 여과기 차압 (bar, >=1.0 역세척, >=1.5 경보)
  uvIntensityWm2?: number;  // UV 살균 방식 시 자외선 강도 (W/m², 기준 >= 250 W/m²)
  neutralizerRateLh: number;// 중화제 주입량 (L/h)
  powerConsumptionKw: number;// 설비 전력 소모량 (kW)
}

export interface AlarmEvent {
  id: string;
  vesselId: string;
  vesselName: string;
  facilityType: FacilityType;
  level: AlarmLevel;
  code: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface RealtimeTelemetryPacket {
  vesselId: string;
  timestamp: string;
  position: Position;
  speedKts: number;
  headingDeg: number;
  scrubber: ScrubberTelemetry;
  bwts: BWTSTelemetry;
}

// ==========================================
// 4대 직무별 데이터 계약 (Data Contracts)
// ==========================================

// 1. 고주파 1초 텔레메트리 원시 레코드 (선박 에지 롤링 버퍼)
export interface RawTelemetryRecord {
  id: string;
  vesselId: string;
  recordedAt: string;
  syncStatus: 'PENDING' | 'COMPLETED';
  soxPpm: number;
  so2Co2Ratio: number;
  washwaterPh: number;
  turbidityNtu: number;
  washwaterFlowM3h: number;
  scrubberDeltaPkPa: number;
  ballastFlowM3h: number;
  filterDeltaPBar: number;
  uvIntensityWm2: number;
  troPpm: number;
  operationMode: 'BALLASTING' | 'DEBALLASTING' | 'IDLE';
}

// 2. 육상 클라우드 1시간 통계 요약 (Inland Control Aggregation)
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

// 3. 선급 및 법정 알람 수명주기 모델 (ISA-18.2 표준)
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

// 4. 판호크 예지보전 5축 설비 건전성 스코어 (0~100점)
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

// 5. 선박 AIS 항행 정보 (AISStream 및 시뮬레이터 공용)
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
