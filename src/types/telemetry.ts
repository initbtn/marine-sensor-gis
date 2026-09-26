/**
 * 해양 친환경 설비(Scrubber / BWTS) 및 선박 텔레메트리 도메인 인터페이스
 */

export type FacilityType = 'SCRUBBER' | 'BWTS';
export type AlarmLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type VesselStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

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
  soxPpm: number;           // 배기가스 SOx 농도 (ppm, 허용치 통상 < 25ppm)
  co2Percent: number;       // 배기가스 CO2 비율 (%)
  so2Co2Ratio: number;      // SO2/CO2 비율 (IMO 규제 기준: 4.3 이하 @ 0.1% S)
  phInlet: number;          // 흡입 해수 pH
  phDischarge: number;      // 배출수 pH (규제: 해수 배출구 4m에서 pH >= 6.5)
  washwaterFlowM3h: number; // 세정수 공급 유량 (m³/h)
  turbidityFtu: number;     // 배출수 탁도 (FTU, 통상 < 25 NTU)
  pahPpb: number;           // 다환방향족탄화수소(PAH) 농도 (ppb)
  pressureDropKpa: number;  // 스크러버 차압 (kPa)
}

/**
 * 선박 평형수 처리 설비(BWTS - Ballast Water Treatment System) 실시간 센서 (IMO D-2 / USCG)
 */
export interface BWTSTelemetry {
  timestamp: string;
  flowRateM3h: number;      // 평형수 처리 유량 (m³/h)
  troPpm: number;           // 잔류 산화물질 농도 (Total Residual Oxidant, ppm)
  filterPressureKpa: number;// 여과기 차압 (kPa)
  uvIntensityWm2?: number;  // UV 살균 방식 시 자외선 강도 (W/m²)
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
