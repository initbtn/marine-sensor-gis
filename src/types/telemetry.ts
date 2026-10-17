/**
 * 해양 친환경 설비(PaSOx Scrubber / GloEn-Patrol BWTS) 및 선박 텔레메트리 도메인 인터페이스
 * IMO MARPOL Annex VI, IMO BWM D-2, IACS UR E26/E27, ISA-18.2 준수
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
 * 탈황 설비(SOx Scrubber) 실시간 센서 텔레메트리 (IMO Resolution MEPC.340(77) 준수)
 */
export interface ScrubberTelemetry {
  timestamp: string;
  so2Ppm?: number;                  // 배기가스 순수 SO2 농도 (ppm, vol)
  co2Percent: number;               // 배기가스 CO2 비율 (%, vol)
  soxPpm: number;                   // 배기가스 SOx 농도 (ppm, 일반: < 21.7ppm, ECA: < 4.3ppm)
  so2Co2Ratio: number;              // SO2/CO2 비율 (IMO 법적 한계: ECA <= 4.3, Global <= 21.7)
  cemsZeroDriftPct?: number;        // CEMS 24h 영점 드리프트율 (선급 한도: <= +-2.0%)
  cemsSpanDriftPct?: number;        // CEMS 24h 스팬 드리프트율 (선급 한도: <= +-2.0%)
  cemsCalibrationStatus?: 'VALID' | 'DUE' | 'FAILED'; // CEMS 센서 교정 상태
  cemsSampleFlowStatus?: 'NORMAL' | 'LOW_FLOW';       // 샘플 가스 흡입 유량 상태
  
  phInlet: number;                  // 흡입 해수 원수 pH (7.8 ~ 8.2)
  phDischarge: number;              // 배출수 pH (선외 배출 시 pH >= 6.5 강제 감시, < 4.0 긴급 차단)
  turbidityFtu: number;             // 배출수 탁도 (FTU/NTU, 기준 < 25 NTU)
  turbidityInletNtu?: number;       // 유입수 탁도
  pahPpb: number;                   // 다환방향족탄화수소(PAH) 농도 (ppb, 기준 < 50 ppb)
  washwaterFlowM3h: number;         // 세정수 공급 유량 (m³/h)
  washwaterTempC?: number;          // 세정수 배출 온도 (해수 대비 +60°C 이하)
  causticSodaDosingRateLh?: number; // 가성소다(NaOH) 중화제 주입량 (L/h)
  causticSodaTankLevelPct?: number; // 중화제 탱크 잔량 (%)
  pressureDropKpa: number;          // 스크러버 타워 차압 (kPa)
}

/**
 * 선박 평형수 처리 설비(BWTS - Ballast Water Treatment System) 실시간 센서 (IMO D-2 / USCG)
 */
export interface BWTSTelemetry {
  timestamp: string;
  operationMode?: 'BALLASTING' | 'DEBALLASTING' | 'STRIPPING' | 'IDLE';
  flowRateM3h: number;              // 평형수 처리 유량 (m³/h, 정격용량 TRC 감시)
  filterInletPressureBar?: number;  // 여과기 인입 압력 (bar)
  filterOutletPressureBar?: number; // 여과기 배출 압력 (bar)
  filterDeltaPBar?: number;         // 여과기 차압 (bar, >=1.0 역세척, >=1.5 경보)
  backwashCycleCount?: number;      // 일일 역세척 수행 횟수 (회/일)
  uvIntensityWm2?: number;          // UV 살균 방식 시 자외선 강도 (W/m², 기준 >= 250 W/m²)
  uvChamberTempC?: number;          // UV 반응기 챔버 온도 (°C, >65°C 셧다운)
  uvLampOperatingHours?: number;    // UV 램프 누적 가동시간 (hr, >2000hr 교체)
  troPpm: number;                   // 잔류 산화물질 농도 (Total Residual Oxidant, ppm, 기준 < 0.1 ppm)
  filterPressureKpa: number;        // 여과기 차압 (kPa 단위 호환)
  neutralizerRateLh: number;        // 중화제 주입량 (L/h)
  powerConsumptionKw: number;       // 설비 전력 소모량 (kW)
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
  gpsSyncUtc?: string;             // IACS UR E26/E27 GPS 원자시계 동기화 타임스탬프
  dataIntegrityHash?: string;       // SHA-256 위변조 방지 무결성 해시
  syncStatus: 'PENDING' | 'COMPLETED';
  
  // Scrubber (MEPC.340(77))
  so2Ppm?: number;
  co2Percent?: number;
  soxPpm: number;
  so2Co2Ratio: number;
  cemsZeroDriftPct?: number;
  cemsSpanDriftPct?: number;
  cemsCalibrationStatus?: 'VALID' | 'DUE' | 'FAILED';
  phInlet?: number;
  washwaterPh: number;
  turbidityNtu: number;
  pahPpb?: number;
  washwaterFlowM3h: number;
  washwaterTempC?: number;
  causticSodaDosingRateLh?: number;
  scrubberDeltaPkPa: number;
  
  // BWTS (BWM D-2)
  operationMode: 'BALLASTING' | 'DEBALLASTING' | 'STRIPPING' | 'IDLE';
  ballastFlowM3h: number;
  filterInletPressureBar?: number;
  filterOutletPressureBar?: number;
  filterDeltaPBar: number;
  backwashCycleCount?: number;
  uvIntensityWm2: number;
  uvChamberTempC?: number;
  uvLampOperatingHours?: number;
  troPpm: number;
}

// 2. 육상 클라우드 1시간 통계 요약 (Inland Control Aggregation)
export interface HourlySummaryRecord {
  id: string;
  vesselId: string;
  windowStartTime: string;
  avgSoxPpm: number;
  maxSoxPpm: number;
  avgSo2Co2Ratio?: number;
  avgWashwaterPh: number;
  minWashwaterPh: number;
  totalWashwaterDischargeM3: number;
  totalBallastTreatedM3: number;
  totalCausticSodaUsedL?: number;
  violationCount: number;
  complianceRatePercent: number; // 목표 >= 99.5%
}

// 3. 선급 및 법정 알람 수명주기 모델 (ISA-18.2 표준)
export interface ComplianceAlarm {
  id: string;
  vesselId: string;
  ruleCode: 'MARPOL_ANNEX_VI' | 'BWM_D2' | 'EQUIPMENT_FAULT' | 'CYBER_SECURITY';
  severity: 'WARNING' | 'CRITICAL';
  status: 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'CLEARED';
  message: string;
  triggerValue: number;
  thresholdValue: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  clearedAt?: string;
}

// 4. 판호크 예지보전 5축 설비 건전성 스코어 (0~100점)
export interface EquipmentHealthScore {
  vesselId: string;
  evaluatedAt: string;
  overallScore: number;
  cemsSensorReliability: number; // 0~100 (24h 드리프트 기반)
  filterDpMargin: number;        // 0~100 (1.5bar 대비 여유도)
  uvLampLifespan: number;        // 0~100 (2000hr 대비 잔여수명)
  pumpEfficiency: number;        // 0~100 (전력 대비 유량 효율)
  neutralizerStability: number;  // 0~100 (목표 pH 제어 정밀도)
  recommendations: Array<{
    targetPart: string;
    actionRequired: string;
    dueDays: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
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
  destination?: string;
  eta?: string;
}
