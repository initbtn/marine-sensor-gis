import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { VesselInfo } from '../../types/telemetry';
import { MarineTheme } from '../../styles/theme';

interface MarineMapProps {
  vessels: VesselInfo[];
  selectedVesselId: string;
  onSelectVessel: (vesselId: string) => void;
  trackHistory?: [number, number][];
  showEcaZone?: boolean;
}

// 부산항 및 대한해협 연안 배출규제해역(ECA / SOx 0.1% Zone) 폴리곤 좌표 (예시)
export const KOREA_STRAIT_ECA_ZONE: [number, number][] = [
  [35.35, 128.95],
  [35.25, 129.35],
  [34.90, 129.50],
  [34.60, 129.10],
  [34.75, 128.50],
  [35.05, 128.60],
];

const createVesselIcon = (headingDeg: number, status: string, isSelected: boolean) => {
  const fillColor =
    status === 'CRITICAL'
      ? MarineTheme.colors.criticalCrimson
      : status === 'WARNING'
      ? MarineTheme.colors.warningAmber
      : MarineTheme.colors.ecoCyan;

  const strokeColor = isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)';
  const strokeWidth = isSelected ? 2.5 : 1.2;

  const svgHtml = `
    <div style="transform: rotate(${headingDeg}deg); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-vessel-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export const MarineMap: React.FC<MarineMapProps> = ({
  vessels,
  selectedVesselId,
  onSelectVessel,
  trackHistory = [],
  showEcaZone = true,
}) => {
  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];
  const center: [number, number] = selectedVessel
    ? [selectedVessel.position.lat, selectedVessel.position.lng]
    : [35.1, 129.04]; // Busan port default

  return (
    <div
      className="marine-map-container relative rounded-xl overflow-hidden shadow-xl"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        border: `1px solid ${MarineTheme.colors.border}`,
        backgroundColor: MarineTheme.colors.bgPrimary,
      }}
      data-testid="marine-map"
    >
      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '480px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 배출규제해역 (ECA Zone) 오버레이 */}
        {showEcaZone && (
          <Polygon
            positions={KOREA_STRAIT_ECA_ZONE}
            pathOptions={{
              color: MarineTheme.colors.warningAmber,
              fillColor: MarineTheme.colors.warningAmber,
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div style={{ padding: '4px', fontSize: '12px' }}>
                <strong style={{ color: MarineTheme.colors.warningAmber }}>
                  ⚠️ IMO MARPOL ECA 배출규제해역
                </strong>
                <p style={{ margin: '4px 0 0 0', color: '#475569' }}>
                  황 함유량 0.10% 이하 강제 (SOx ≤ 4.3 ppm / pH ≥ 6.5)
                </p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* 실시간 선박 이동 항적 폴리라인 */}
        {trackHistory.length > 1 && (
          <Polyline
            positions={trackHistory}
            color={MarineTheme.colors.ecoCyan}
            dashArray="4, 6"
            weight={3}
            opacity={0.85}
          />
        )}

        {/* 선박 선수각 회전 마커 렌더링 */}
        {vessels.map((vessel) => {
          const isSelected = vessel.id === selectedVesselId;
          const icon = createVesselIcon(vessel.headingDeg, vessel.status, isSelected);

          return (
            <Marker
              key={vessel.id}
              position={[vessel.position.lat, vessel.position.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectVessel(vessel.id),
              }}
            >
              <Popup>
                <div style={{ padding: '4px', fontSize: '13px', color: '#1e293b' }}>
                  <div className="font-bold text-sm text-slate-900">{vessel.name}</div>
                  <div style={{ color: '#64748b', margin: '2px 0', fontSize: '11px' }}>
                    IMO: {vessel.imoNumber} | {vessel.vesselType}
                  </div>
                  <div style={{ margin: '4px 0' }}>
                    속력: <strong>{vessel.speedKts} kts</strong> | 침로: <strong>{vessel.headingDeg}°</strong>
                  </div>
                  <div>
                    목적지: <strong>{vessel.destination}</strong> (ETA: {vessel.eta})
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    상태:{' '}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor:
                          vessel.status === 'CRITICAL'
                            ? MarineTheme.colors.criticalCrimson
                            : vessel.status === 'WARNING'
                            ? MarineTheme.colors.warningAmber
                            : '#059669',
                      }}
                    >
                      {vessel.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 지도 우상단 범례 (Map Legend Overlay) */}
      <div
        className="absolute top-3 right-3 z-[1000] p-2.5 rounded-lg text-xs shadow-lg flex flex-col gap-1.5 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(11, 19, 43, 0.85)',
          border: `1px solid ${MarineTheme.colors.border}`,
          color: MarineTheme.colors.textSecondary,
        }}
      >
        <span className="font-bold text-white text-[11px] mb-0.5">범례 (Legend)</span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MarineTheme.colors.ecoCyan }} />
          <span>정상 가동 선박</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MarineTheme.colors.warningAmber }} />
          <span>경보 / 주의 선박</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MarineTheme.colors.criticalCrimson }} />
          <span>규제 초과 선박</span>
        </div>
        {showEcaZone && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
            <span
              className="w-3 h-2 rounded border border-dashed"
              style={{
                borderColor: MarineTheme.colors.warningAmber,
                backgroundColor: 'rgba(255, 159, 28, 0.3)',
              }}
            />
            <span style={{ color: MarineTheme.colors.warningAmber }}>ECA 규제해역 (0.1% S)</span>
          </div>
        )}
      </div>
    </div>
  );
};
