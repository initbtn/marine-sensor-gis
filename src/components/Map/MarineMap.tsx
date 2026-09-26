import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { VesselInfo } from '../../types/telemetry';

interface MarineMapProps {
  vessels: VesselInfo[];
  selectedVesselId: string;
  onSelectVessel: (vesselId: string) => void;
  trackHistory?: [number, number][];
}

const createVesselIcon = (headingDeg: number, status: string, isSelected: boolean) => {
  const fillColor = status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : '#10b981';
  const strokeColor = isSelected ? '#3b82f6' : '#ffffff';
  const strokeWidth = isSelected ? 3 : 1.5;

  const svgHtml = `
    <div style="transform: rotate(${headingDeg}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-vessel-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const MarineMap: React.FC<MarineMapProps> = ({
  vessels,
  selectedVesselId,
  onSelectVessel,
  trackHistory = [],
}) => {
  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];
  const center: [number, number] = [selectedVessel.position.lat, selectedVessel.position.lng];

  return (
    <div className="marine-map-container" style={{ width: '100%', height: '100%', minHeight: '450px' }} data-testid="marine-map">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '450px', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trackHistory.length > 1 && (
          <Polyline
            positions={trackHistory}
            color="#3b82f6"
            dashArray="4, 8"
            weight={3}
            opacity={0.8}
          />
        )}

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
                <div style={{ padding: '4px', fontSize: '13px' }}>
                  <strong style={{ fontSize: '14px', color: '#1e293b' }}>{vessel.name}</strong>
                  <div style={{ color: '#64748b', margin: '2px 0' }}>IMO: {vessel.imoNumber} | {vessel.vesselType}</div>
                  <div>속력: <strong>{vessel.speedKts} kts</strong> | 침로: <strong>{vessel.headingDeg}°</strong></div>
                  <div>목적지: <strong>{vessel.destination}</strong> (ETA: {vessel.eta})</div>
                  <div style={{ marginTop: '4px' }}>
                    상태:{' '}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor:
                          vessel.status === 'CRITICAL'
                            ? '#ef4444'
                            : vessel.status === 'WARNING'
                            ? '#f59e0b'
                            : '#10b981',
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
    </div>
  );
};
