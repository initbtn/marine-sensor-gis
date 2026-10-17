import type { VesselInfo, VesselStatus } from '../types/telemetry';

export interface AisPositionReportPayload {
  MessageType: 'PositionReport';
  MetaData: {
    MMSI: number;
    MMSI_String?: string;
    ShipName?: string;
    latitude: number;
    longitude: number;
    time_utc?: string;
  };
  Message: {
    PositionReport: {
      MessageID: number;
      Sog: number;          // Speed over ground (Knot)
      Cog: number;          // Course over ground (Degree)
      TrueHeading: number;  // 0~359, 511 = 센서 없음/미제공
      NavigationalStatus: number;
      Latitude: number;
      Longitude: number;
    };
  };
}

export interface AisShipStaticPayload {
  MessageType: 'ShipStaticData';
  MetaData: {
    MMSI: number;
    ShipName?: string;
  };
  Message: {
    ShipStaticData: {
      MessageID: number;
      ImoNumber: number;
      CallSign: string;
      Name: string;
      ShipType: number;
      Destination: string;
      Dimension?: {
        A: number;
        B: number;
        C: number;
        D: number;
      };
      Eta?: {
        Month: number;
        Day: number;
        Hour: number;
        Minute: number;
      };
    };
  };
}

export type AisStreamRawMessage = AisPositionReportPayload | AisShipStaticPayload;

/**
 * AIS NavigationalStatus 코드를 우리 VesselStatus로 변환
 * 0: Under way using engine, 1: At anchor, 5: Moored
 */
export function mapNavigationalStatus(status: number): VesselStatus {
  // 0: 항해 중 -> NORMAL
  // 14: AIS-SART (비상 조난) 등 -> CRITICAL
  if (status === 14) return 'CRITICAL';
  return 'NORMAL';
}

/**
 * PositionReport 메시지를 VesselInfo 부분 속성으로 변환
 * NMEA 예외: TrueHeading이 511(센서 없음)이면 Cog로 자동 대체
 */
export function adaptPositionReport(payload: AisPositionReportPayload): Partial<VesselInfo> {
  const meta = payload.MetaData;
  const msg = payload.Message.PositionReport;

  // TrueHeading이 511이면 유효한 Cog로 대체
  const headingDeg = msg.TrueHeading === 511 ? msg.Cog : msg.TrueHeading;

  // SOG 102.3은 측정 불가를 의미하므로 0.0 처리
  const speedKts = msg.Sog >= 102.3 ? 0.0 : msg.Sog;

  const lat = msg.Latitude !== undefined ? msg.Latitude : meta.latitude;
  const lng = msg.Longitude !== undefined ? msg.Longitude : meta.longitude;

  return {
    id: String(meta.MMSI),
    name: meta.ShipName || undefined,
    position: { lat, lng },
    speedKts,
    headingDeg,
    status: mapNavigationalStatus(msg.NavigationalStatus),
  };
}

/**
 * ShipStaticData 메시지를 선박 정적 제원으로 변환
 */
export function adaptShipStaticData(
  payload: AisShipStaticPayload
): Partial<VesselInfo> & { lengthMeters?: number; beamMeters?: number } {
  const meta = payload.MetaData;
  const msg = payload.Message.ShipStaticData;

  const lengthMeters = msg.Dimension ? msg.Dimension.A + msg.Dimension.B : undefined;
  const beamMeters = msg.Dimension ? msg.Dimension.C + msg.Dimension.D : undefined;

  let etaStr = '';
  if (msg.Eta && msg.Eta.Month && msg.Eta.Day) {
    const year = new Date().getUTCFullYear();
    const mm = String(msg.Eta.Month).padStart(2, '0');
    const dd = String(msg.Eta.Day).padStart(2, '0');
    const hh = String(msg.Eta.Hour || 0).padStart(2, '0');
    const mi = String(msg.Eta.Minute || 0).padStart(2, '0');
    etaStr = `${year}-${mm}-${dd}T${hh}:${mi}:00Z`;
  }

  return {
    id: String(meta.MMSI),
    name: msg.Name ? msg.Name.trim() : meta.ShipName,
    imoNumber: msg.ImoNumber ? String(msg.ImoNumber) : '',
    callSign: msg.CallSign ? msg.CallSign.trim() : '',
    destination: msg.Destination ? msg.Destination.trim() : '',
    eta: etaStr || undefined,
    lengthMeters,
    beamMeters,
  };
}

/**
 * 기존 VesselInfo와 수신된 최신 텔레메트리 업데이트를 병합
 */
export function mergeVesselTelemetry(
  existing: VesselInfo,
  update: Partial<VesselInfo>
): VesselInfo {
  return {
    ...existing,
    ...update,
    name: update.name || existing.name,
    imoNumber: update.imoNumber || existing.imoNumber,
    callSign: update.callSign || existing.callSign,
    destination: update.destination || existing.destination,
    position: update.position || existing.position,
    speedKts: update.speedKts !== undefined ? update.speedKts : existing.speedKts,
    headingDeg: update.headingDeg !== undefined ? update.headingDeg : existing.headingDeg,
    status: update.status || existing.status,
  };
}
