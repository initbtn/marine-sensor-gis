import {
  VesselInfo,
  ScrubberTelemetry,
  BWTSTelemetry,
  AlarmEvent,
  RealtimeTelemetryPacket,
} from '../types/telemetry';

export const INITIAL_VESSELS: VesselInfo[] = [
  {
    id: 'VSL-001',
    name: 'PANAMAX PIONEER',
    imoNumber: '9812345',
    callSign: 'D7AA2',
    vesselType: 'Container Ship (15,000 TEU)',
    flag: 'Republic of Korea',
    position: { lat: 34.85, lng: 128.75 }, // 부산-거제 인근 해역
    speedKts: 18.4,
    headingDeg: 215,
    destination: 'SGP SIN',
    eta: '2026-09-29 08:00',
    status: 'NORMAL',
  },
  {
    id: 'VSL-002',
    name: 'ECO OCEAN',
    imoNumber: '9876543',
    callSign: 'V7BC8',
    vesselType: 'VLCC Crude Oil Tanker (300,000 DWT)',
    flag: 'Marshall Islands',
    position: { lat: 1.25, lng: 103.85 }, // 싱가포르 해협
    speedKts: 13.2,
    headingDeg: 105,
    destination: 'KOR USN',
    eta: '2026-10-04 14:00',
    status: 'WARNING',
  },
  {
    id: 'VSL-003',
    name: 'PACIFIC HARMONY',
    imoNumber: '9923456',
    callSign: 'HL9142',
    vesselType: 'LNG Carrier (174,000 m³)',
    flag: 'Panama',
    position: { lat: 21.15, lng: 121.5 }, // 바시 해협
    speedKts: 19.8,
    headingDeg: 45,
    destination: 'JPN TYO',
    eta: '2026-09-28 16:30',
    status: 'NORMAL',
  },
];

export const DEFAULT_VESSEL_TRACKS: Record<string, { lat: number; lng: number }[]> = {
  'VSL-001': [
    { lat: 35.102, lng: 129.040 }, // 부산 신항 출항
    { lat: 35.020, lng: 128.950 },
    { lat: 34.930, lng: 128.840 },
    { lat: 34.850, lng: 128.750 }, // 현재 위치 (거제도 남동방)
  ],
  'VSL-002': [
    { lat: 1.160, lng: 103.620 },  // 말라카 해협 진입
    { lat: 1.200, lng: 103.710 },
    { lat: 1.230, lng: 103.790 },
    { lat: 1.250, lng: 103.850 },  // 현재 위치 (싱가포르 동쪽)
  ],
  'VSL-003': [
    { lat: 20.800, lng: 120.900 }, // 남중국해 북상
    { lat: 20.950, lng: 121.150 },
    { lat: 21.050, lng: 121.320 },
    { lat: 21.150, lng: 121.500 },  // 현재 위치 (바시 해협)
  ],
};

export const COMPASS_DIRECTIONS_16 = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
] as const;

/**
 * Converts heading degrees (0~360) to 16 cardinal compass directions
 */
export function getCompassDirection16(headingDeg: number): string {
  const normalized = ((headingDeg % 360) + 360) % 360;
  const index = Math.floor(((normalized + 11.25) % 360) / 22.5);
  return COMPASS_DIRECTIONS_16[index];
}

export interface DeadReckoningResult {
  position: { lat: number; lng: number };
  headingDeg: number;
  compassDirection: string;
}

/**
 * Calculates new vessel coordinates based on dead reckoning (speed, heading, elapsed time)
 */
export function calculateDeadReckoningPosition(
  vessel: VesselInfo,
  deltaSeconds: number = 5,
  simulationSpeedMultiplier: number = 1.0
): DeadReckoningResult {
  const headingRad = (vessel.headingDeg * Math.PI) / 180;
  // 1 knot = 1 nautical mile / hour = 1/3600 nm/s
  // 1 nautical mile = 1 minute of latitude = 1/60 degrees latitude
  const distanceNm = (vessel.speedKts * (deltaSeconds / 3600)) * simulationSpeedMultiplier;

  // Delta latitude in degrees
  const dLat = (distanceNm * Math.cos(headingRad)) / 60;

  // Delta longitude in degrees (compensated for latitude convergence)
  const avgLatRad = (vessel.position.lat * Math.PI) / 180;
  const cosLat = Math.cos(avgLatRad);
  const dLng = (distanceNm * Math.sin(headingRad)) / (60 * (cosLat === 0 ? 1 : Math.abs(cosLat)));

  const newLat = Number((vessel.position.lat + dLat).toFixed(6));
  const newLng = Number((vessel.position.lng + dLng).toFixed(6));
  const compassDirection = getCompassDirection16(vessel.headingDeg);

  return {
    position: { lat: newLat, lng: newLng },
    headingDeg: vessel.headingDeg,
    compassDirection,
  };
}

export function generateScrubberTelemetry(base?: Partial<ScrubberTelemetry>): ScrubberTelemetry {
  const now = new Date().toISOString();
  const soxPpm = base?.soxPpm ?? Number((12 + Math.random() * 8).toFixed(1)); // 12~20 ppm (기준 25 이하)
  const co2Percent = base?.co2Percent ?? Number((4.5 + Math.random() * 0.8).toFixed(2));
  const so2Co2Ratio = Number(((soxPpm / (co2Percent * 10000)) * 1000).toFixed(2));

  return {
    timestamp: now,
    soxPpm,
    co2Percent,
    so2Co2Ratio,
    phInlet: base?.phInlet ?? Number((8.1 + Math.random() * 0.2).toFixed(2)),
    phDischarge: base?.phDischarge ?? Number((6.8 + Math.random() * 0.4).toFixed(2)), // 배출 규제: >= 6.5
    washwaterFlowM3h: base?.washwaterFlowM3h ?? Math.round(1200 + Math.random() * 150),
    turbidityFtu: base?.turbidityFtu ?? Number((8.5 + Math.random() * 4.0).toFixed(1)), // 규제: < 25 FTU
    pahPpb: base?.pahPpb ?? Number((15 + Math.random() * 10).toFixed(1)),
    pressureDropKpa: base?.pressureDropKpa ?? Number((1.2 + Math.random() * 0.3).toFixed(2)),
  };
}

export function generateBWTSTelemetry(base?: Partial<BWTSTelemetry>): BWTSTelemetry {
  const now = new Date().toISOString();
  return {
    timestamp: now,
    flowRateM3h: base?.flowRateM3h ?? Math.round(500 + Math.random() * 80),
    troPpm: base?.troPpm ?? Number((0.15 + Math.random() * 0.1).toFixed(3)), // 잔류 산화물 < 0.2 ppm 규제
    filterPressureKpa: base?.filterPressureKpa ?? Number((45 + Math.random() * 10).toFixed(1)),
    uvIntensityWm2: base?.uvIntensityWm2 ?? Math.round(850 + Math.random() * 100),
    neutralizerRateLh: base?.neutralizerRateLh ?? Number((3.5 + Math.random() * 0.8).toFixed(2)),
    powerConsumptionKw: base?.powerConsumptionKw ?? Math.round(48 + Math.random() * 8),
  };
}

export function evaluateAlarms(
  vessel: VesselInfo,
  scrubber: ScrubberTelemetry,
  bwts: BWTSTelemetry
): AlarmEvent[] {
  const alarms: AlarmEvent[] = [];
  const now = new Date().toISOString();

  // Scrubber IMO 기준 검사: 배출수 pH < 6.5
  if (scrubber.phDischarge < 6.5) {
    alarms.push({
      id: `ALM-PH-${Date.now()}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      facilityType: 'SCRUBBER',
      level: 'CRITICAL',
      code: 'SCRUB-001',
      message: `배출 세정수 산성도 기준치 미달 (pH ${scrubber.phDischarge} < 6.5)`,
      timestamp: now,
      acknowledged: false,
    });
  }

  // Scrubber IMO 기준 검사: 배출 탁도 > 25 FTU
  if (scrubber.turbidityFtu > 25.0) {
    alarms.push({
      id: `ALM-TURB-${Date.now()}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      facilityType: 'SCRUBBER',
      level: 'WARNING',
      code: 'SCRUB-002',
      message: `배출수 탁도 한도 초과 (${scrubber.turbidityFtu} FTU > 25.0 FTU)`,
      timestamp: now,
      acknowledged: false,
    });
  }

  // BWTS 기준 검사: 여과기 차압 > 75 kPa (역세척 필요)
  if (bwts.filterPressureKpa > 75.0) {
    alarms.push({
      id: `ALM-BWTS-FILT-${Date.now()}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      facilityType: 'BWTS',
      level: 'WARNING',
      code: 'BWTS-001',
      message: `여과기 차압 상승으로 자동 역세척 권고 (${bwts.filterPressureKpa} kPa)`,
      timestamp: now,
      acknowledged: false,
    });
  }

  return alarms;
}

export function createRealtimePacket(vessel: VesselInfo): RealtimeTelemetryPacket {
  const scrubber = generateScrubberTelemetry();
  const bwts = generateBWTSTelemetry();
  return {
    vesselId: vessel.id,
    timestamp: new Date().toISOString(),
    position: {
      lat: vessel.position.lat + (Math.random() - 0.5) * 0.005,
      lng: vessel.position.lng + (Math.random() - 0.5) * 0.005,
    },
    speedKts: vessel.speedKts,
    headingDeg: vessel.headingDeg,
    scrubber,
    bwts,
  };
}
