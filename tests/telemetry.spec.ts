import { describe, it, expect } from 'vitest';
import {
  INITIAL_VESSELS,
  generateScrubberTelemetry,
  generateBWTSTelemetry,
  evaluateAlarms,
  createRealtimePacket,
} from '../src/services/mockTelemetry';

describe('Marine Telemetry Service Tests', () => {
  it('초기 선박 데이터는 3척 이상 등록되어 있어야 한다', () => {
    expect(INITIAL_VESSELS.length).toBeGreaterThanOrEqual(3);
    const pioneer = INITIAL_VESSELS.find((v) => v.name === 'PANAMAX PIONEER');
    expect(pioneer).toBeDefined();
    expect(pioneer?.imoNumber).toBe('9812345');
    expect(pioneer?.position.lat).toBeGreaterThan(0);
  });

  it('Scrubber 텔레메트리는 IMO 규제 항목(SOx, pH, 탁도)을 정상 생성해야 한다', () => {
    const telemetry = generateScrubberTelemetry();
    expect(telemetry.soxPpm).toBeGreaterThan(0);
    expect(telemetry.co2Percent).toBeGreaterThan(0);
    expect(telemetry.so2Co2Ratio).toBeGreaterThan(0);
    expect(telemetry.phInlet).toBeGreaterThan(7.0);
    expect(telemetry.phDischarge).toBeGreaterThan(5.0);
    expect(telemetry.washwaterFlowM3h).toBeGreaterThan(500);
    expect(telemetry.turbidityFtu).toBeGreaterThan(0);
  });

  it('BWTS 텔레메트리는 평형수 처리 지표(유량, TRO, 차압)를 정상 생성해야 한다', () => {
    const telemetry = generateBWTSTelemetry();
    expect(telemetry.flowRateM3h).toBeGreaterThan(0);
    expect(telemetry.troPpm).toBeGreaterThan(0);
    expect(telemetry.filterPressureKpa).toBeGreaterThan(0);
    expect(telemetry.powerConsumptionKw).toBeGreaterThan(0);
  });

  it('Scrubber 배출수 pH가 6.5 미만일 때 CRITICAL 알람을 발행해야 한다 (IMO 규제 준수)', () => {
    const vessel = INITIAL_VESSELS[0];
    const normalScrubber = generateScrubberTelemetry({ phDischarge: 6.8 });
    const normalBwts = generateBWTSTelemetry({ filterPressureKpa: 40 });

    const normalAlarms = evaluateAlarms(vessel, normalScrubber, normalBwts);
    expect(normalAlarms.some((a) => a.code === 'SCRUB-001')).toBe(false);

    const acidScrubber = generateScrubberTelemetry({ phDischarge: 6.2 });
    const acidAlarms = evaluateAlarms(vessel, acidScrubber, normalBwts);
    const phAlarm = acidAlarms.find((a) => a.code === 'SCRUB-001');
    expect(phAlarm).toBeDefined();
    expect(phAlarm?.level).toBe('CRITICAL');
    expect(phAlarm?.message).toContain('6.2 < 6.5');
  });

  it('Scrubber 배출 탁도가 25 FTU를 초과할 때 WARNING 알람을 발행해야 한다', () => {
    const vessel = INITIAL_VESSELS[0];
    const turbidScrubber = generateScrubberTelemetry({ phDischarge: 7.0, turbidityFtu: 28.4 });
    const normalBwts = generateBWTSTelemetry();

    const alarms = evaluateAlarms(vessel, turbidScrubber, normalBwts);
    const turbAlarm = alarms.find((a) => a.code === 'SCRUB-002');
    expect(turbAlarm).toBeDefined();
    expect(turbAlarm?.level).toBe('WARNING');
    expect(turbAlarm?.message).toContain('28.4 FTU > 25.0 FTU');
  });

  it('BWTS 여과기 차압이 75 kPa를 초과할 때 WARNING 역세척 권고 알람을 발행해야 한다', () => {
    const vessel = INITIAL_VESSELS[0];
    const normalScrubber = generateScrubberTelemetry({ phDischarge: 7.0, turbidityFtu: 10 });
    const highPressureBwts = generateBWTSTelemetry({ filterPressureKpa: 82.5 });

    const alarms = evaluateAlarms(vessel, normalScrubber, highPressureBwts);
    const filterAlarm = alarms.find((a) => a.code === 'BWTS-001');
    expect(filterAlarm).toBeDefined();
    expect(filterAlarm?.level).toBe('WARNING');
    expect(filterAlarm?.message).toContain('82.5 kPa');
  });

  it('실시간 패킷 생성기는 선박 위치와 센서 텔레메트리를 포함해야 한다', () => {
    const vessel = INITIAL_VESSELS[0];
    const packet = createRealtimePacket(vessel);
    expect(packet.vesselId).toBe(vessel.id);
    expect(packet.position.lat).toBeDefined();
    expect(packet.position.lng).toBeDefined();
    expect(packet.scrubber).toBeDefined();
    expect(packet.bwts).toBeDefined();
  });
});
