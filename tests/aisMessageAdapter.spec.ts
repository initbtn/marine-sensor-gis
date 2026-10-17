import { describe, it, expect } from 'vitest';
import {
  adaptPositionReport,
  adaptShipStaticData,
  mergeVesselTelemetry,
  type AisPositionReportPayload,
  type AisShipStaticPayload,
} from '../src/services/aisMessageAdapter';

describe('글로벌 위성 AIS 메시지 어댑터 (aisMessageAdapter)', () => {
  it('PositionReport 메시지를 VesselInfo 위치 속성으로 변환해야 한다', () => {
    const rawPos: AisPositionReportPayload = {
      MessageType: 'PositionReport',
      MetaData: {
        MMSI: 255805678,
        ShipName: 'PANASIA PHOENIX',
        latitude: 35.0841,
        longitude: 129.0425,
        time_utc: '2026-10-18 00:40:12 UTC',
      },
      Message: {
        PositionReport: {
          MessageID: 1,
          Sog: 14.8,
          Cog: 182.4,
          TrueHeading: 184,
          NavigationalStatus: 0,
          Latitude: 35.084123,
          Longitude: 129.042512,
        },
      },
    };

    const adapted = adaptPositionReport(rawPos);

    expect(adapted.position?.lat).toBe(35.084123);
    expect(adapted.position?.lng).toBe(129.042512);
    expect(adapted.speedKts).toBe(14.8);
    expect(adapted.headingDeg).toBe(184);
    expect(adapted.status).toBe('NORMAL');
  });

  it('TrueHeading이 511(센서 미제공)인 경우 Cog(대지침로)로 자동 스냅 대체해야 한다', () => {
    const rawPosNoGyro: AisPositionReportPayload = {
      MessageType: 'PositionReport',
      MetaData: { MMSI: 123456789, latitude: 34.5, longitude: 128.8 },
      Message: {
        PositionReport: {
          MessageID: 1,
          Sog: 12.0,
          Cog: 275.5,
          TrueHeading: 511, // NMEA 예외치: 센서 없음
          NavigationalStatus: 0,
          Latitude: 34.5,
          Longitude: 128.8,
        },
      },
    };

    const adapted = adaptPositionReport(rawPosNoGyro);

    expect(adapted.headingDeg).toBe(275.5); // Cog로 대체 검증
  });

  it('ShipStaticData 메시지를 선박 제원 및 목적지 정보로 변환해야 한다', () => {
    const rawStatic: AisShipStaticPayload = {
      MessageType: 'ShipStaticData',
      MetaData: {
        MMSI: 255805678,
        ShipName: 'PANASIA PHOENIX',
      },
      Message: {
        ShipStaticData: {
          MessageID: 5,
          ImoNumber: 9876543,
          CallSign: 'DSPE7',
          Name: 'PANASIA PHOENIX',
          ShipType: 70,
          Destination: 'BUSAN NEW PORT',
          Dimension: { A: 100, B: 25, C: 10, D: 10 },
          Eta: { Month: 10, Day: 20, Hour: 14, Minute: 0 },
        },
      },
    };

    const adapted = adaptShipStaticData(rawStatic);

    expect(adapted.imoNumber).toBe('9876543');
    expect(adapted.callSign).toBe('DSPE7');
    expect(adapted.name).toBe('PANASIA PHOENIX');
    expect(adapted.destination).toBe('BUSAN NEW PORT');
    expect(adapted.lengthMeters).toBe(125); // A + B = 100 + 25
    expect(adapted.beamMeters).toBe(20);    // C + D = 10 + 10
  });

  it('동적 위치와 정적 메타데이터를 하나의 통합 VesselInfo로 병합해야 한다', () => {
    const baseVessel = {
      id: '255805678',
      name: 'UNKNOWN',
      imoNumber: '',
      callSign: '',
      vesselType: 'CARGO',
      flag: 'PA',
      position: { lat: 0, lng: 0 },
      speedKts: 0,
      headingDeg: 0,
      destination: '',
      eta: '',
      status: 'NORMAL' as const,
    };

    const update = {
      name: 'PANASIA PHOENIX',
      imoNumber: '9876543',
      position: { lat: 35.1, lng: 129.0 },
      speedKts: 15.2,
      headingDeg: 190,
      destination: 'BUSAN',
    };

    const merged = mergeVesselTelemetry(baseVessel, update);

    expect(merged.name).toBe('PANASIA PHOENIX');
    expect(merged.imoNumber).toBe('9876543');
    expect(merged.position.lat).toBe(35.1);
    expect(merged.speedKts).toBe(15.2);
    expect(merged.destination).toBe('BUSAN');
  });
});
