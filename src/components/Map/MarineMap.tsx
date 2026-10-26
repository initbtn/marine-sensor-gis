import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { VesselInfo, Position } from '../../types/telemetry';
import { DEFAULT_VESSEL_TRACKS, getCompassDirection16 } from '../../services/mockTelemetry';
import { Compass, Crosshair, Layers } from 'lucide-react';

// Custom vessel SVG marker creator with heading rotation (IEC 62288)
export const createVesselIcon = (
  status: 'NORMAL' | 'WARNING' | 'CRITICAL',
  isSelected: boolean,
  headingDeg: number = 0
) => {
  const colorMap = {
    NORMAL: '#00F5D4',
    WARNING: '#FF9F1C',
    CRITICAL: '#E71D36',
  };
  const color = colorMap[status];
  const size = isSelected ? 36 : 28;
  const strokeColor = isSelected ? '#FFFFFF' : '#0B132B';
  const strokeWidth = isSelected ? 3 : 1.5;

  return L.divIcon({
    className: 'custom-vessel-marker',
    html: `
      <div style="width: ${size}px; height: ${size}px; transform: rotate(${headingDeg}deg); transform-origin: center center; display: flex; align-items: center; justify-content: center; transition: transform 0.4s ease;">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.6));">
          <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          <line x1="12" y1="2" x2="12" y2="0" stroke="#FFFFFF" stroke-width="2" />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// 대한해역 배출규제해역 (ECA Zone) 예시 다각형 좌표
const KOREA_STRAIT_ECA_ZONE: [number, number][] = [
  [34.8, 128.5],
  [35.4, 129.5],
  [35.2, 130.2],
  [34.4, 129.2],
  [34.8, 128.5],
];

interface MapViewControllerProps {
  selectedVessel?: VesselInfo;
  vessels: VesselInfo[];
  fitFleetTrigger: number;
  focusTrigger: number;
}

/**
 * Leaflet 동적 뷰포트 제어기 (useMap 훅 활용)
 * - 선박 선택 시: 해당 선박 위치로 부드럽게 자동 포커싱(flyTo)
 * - 전체 선단 보기 클릭 시: 전 선박(부산~대만~싱가포르)이 한눈에 보이는 바운드로 자동 맞춤(fitBounds)
 */
export const MapViewController: React.FC<MapViewControllerProps> = ({
  selectedVessel,
  vessels,
  fitFleetTrigger,
  focusTrigger,
}) => {
  const map = useMap();
  const prevVesselIdRef = React.useRef<string | undefined>(selectedVessel?.id);

  // 1. 선박 선택 시 자동 flyTo (선박 ID가 변경되거나 초점 트리거 발생 시)
  React.useEffect(() => {
    if (!selectedVessel) return;
    map.flyTo([selectedVessel.position.lat, selectedVessel.position.lng], 8, {
      duration: 1.2,
    });
    prevVesselIdRef.current = selectedVessel.id;
  }, [selectedVessel?.id, focusTrigger, map]);

  // 2. 전체 선단 한눈에 보기 (fitBounds)
  React.useEffect(() => {
    if (fitFleetTrigger === 0 || vessels.length === 0) return;
    const points: [number, number][] = vessels.map((v) => [
      v.position.lat,
      v.position.lng,
    ]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 6,
      animate: true,
      duration: 1.2,
    });
  }, [fitFleetTrigger, vessels, map]);

  return null;
};

export interface MarineMapProps {
  vessels: VesselInfo[];
  selectedVessel?: VesselInfo;
  onSelectVessel?: (vesselId: string) => void;
  trackHistory?: Position[];
  showEcaZone?: boolean;
}

export const MarineMap: React.FC<MarineMapProps> = ({
  vessels,
  selectedVessel,
  onSelectVessel,
  trackHistory = [],
  showEcaZone = true,
}) => {
  const [fitFleetTrigger, setFitFleetTrigger] = React.useState(0);
  const [focusTrigger, setFocusTrigger] = React.useState(0);
  const [isLegendOpen, setIsLegendOpen] = React.useState(false);

  const center: [number, number] = selectedVessel
    ? [selectedVessel.position.lat, selectedVessel.position.lng]
    : [35.1, 129.04]; // Busan port default

  const activeTrack: Position[] =
    trackHistory && trackHistory.length > 1
      ? trackHistory
      : selectedVessel && DEFAULT_VESSEL_TRACKS[selectedVessel.id]
      ? DEFAULT_VESSEL_TRACKS[selectedVessel.id]
      : [];

  return (
    <div
      className="marine-map-container relative rounded-xl overflow-hidden shadow-xl w-full h-full min-h-[480px] border border-marine-border bg-marine-app"
      data-testid="marine-map"
    >
      {/* 맵 상단 좌측: 선단 뷰포트 빠른 조작 컨트롤 바 */}
      <div className="absolute top-3 left-14 z-[1000] flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setFitFleetTrigger((prev) => prev + 1)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md bg-slate-900/90 hover:bg-slate-800 text-marine-cyan border border-marine-border shadow-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          data-testid="btn-fit-fleet"
          title="모든 선박(부산~대만~싱가포르)이 한 화면에 보이도록 바운드 자동 맞춤"
        >
          <Compass className="w-3.5 h-3.5 text-marine-cyan" />
          <span>전체 선단 보기</span>
        </button>
        {selectedVessel && (
          <button
            type="button"
            onClick={() => setFocusTrigger((prev) => prev + 1)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-marine-border shadow-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            data-testid="btn-focus-selected"
            title={`${selectedVessel.name} 위치로 뷰포트 이동`}
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>{selectedVessel.name} 추적</span>
          </button>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[480px]"
      >
        <MapViewController
          selectedVessel={selectedVessel}
          vessels={vessels}
          fitFleetTrigger={fitFleetTrigger}
          focusTrigger={focusTrigger}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 배출규제해역 (ECA Zone) 오버레이 */}
        {showEcaZone && (
          <Polygon
            positions={KOREA_STRAIT_ECA_ZONE}
            pathOptions={{
              color: '#FF9F1C',
              fillColor: '#FF9F1C',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <strong className="text-amber-600">
                  ⚠️ IMO MARPOL ECA 배출규제해역
                </strong>
                <p className="mt-1 m-0 text-slate-600">
                  황 함유량 0.10% 이하 강제 (SOx ≤ 4.3 ppm / pH ≥ 6.5)
                </p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* 1. 실시간 선박 이동 항적 폴리라인 및 웨이포인트 */}
        {activeTrack.length > 1 && (
          <>
            <Polyline
              positions={activeTrack.map((p) => [p.lat, p.lng])}
              color="#00F5D4"
              dashArray="6, 6"
              weight={3}
              opacity={0.9}
            />
            {activeTrack.map((pt, idx) => (
              <CircleMarker
                key={`wp-${idx}`}
                center={[pt.lat, pt.lng]}
                radius={idx === activeTrack.length - 1 ? 5 : 3.5}
                pathOptions={{
                  color: '#00F5D4',
                  fillColor: idx === activeTrack.length - 1 ? '#00F5D4' : '#0B132B',
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                  <span className="text-[10px] font-mono">
                    {idx === activeTrack.length - 1 ? '현재 위치 (GPS)' : `항로 WP-${idx + 1}`}
                  </span>
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        )}

        {/* 2. IEC 62288 전방 침로/속력 벡터 (Speed & Heading Leader Lines) */}
        {vessels.map((v) => {
          const rad = (v.headingDeg * Math.PI) / 180;
          const vectorLen = (v.speedKts / 20) * 0.12;
          const targetLat = v.position.lat + Math.cos(rad) * vectorLen;
          const targetLng = v.position.lng + Math.sin(rad) * vectorLen * 1.2;
          const isSelected = selectedVessel?.id === v.id;

          return (
            <Polyline
              key={`heading-vector-${v.id}`}
              positions={[
                [v.position.lat, v.position.lng],
                [targetLat, targetLng],
              ]}
              color={isSelected ? '#FFFFFF' : '#00F5D4'}
              weight={isSelected ? 2.5 : 1.5}
              dashArray={isSelected ? undefined : '3, 4'}
              opacity={0.9}
            />
          );
        })}

        {/* 3. 선박 위치 마커 표출 (headingDeg 각도 회전 적용) */}
        {vessels.map((vessel) => {
          const isSelected = selectedVessel?.id === vessel.id;
          return (
            <Marker
              key={vessel.id}
              position={[vessel.position.lat, vessel.position.lng]}
              icon={createVesselIcon(vessel.status, isSelected, vessel.headingDeg)}
              eventHandlers={{
                click: () => onSelectVessel?.(vessel.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={0.92} permanent>
                <div className="text-[11px] font-semibold text-slate-900 flex items-center gap-1">
                  <span>{vessel.name}</span>
                  <span className="text-cyan-700 font-bold">
                    [{vessel.headingDeg}° {getCompassDirection16(vessel.headingDeg)}]
                  </span>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-1 text-xs text-slate-800">
                  <div className="font-bold text-sm text-slate-900">{vessel.name}</div>
                  <div className="text-slate-500 my-0.5 text-[11px]">
                    IMO: {vessel.imoNumber} | {vessel.vesselType}
                  </div>
                  <div className="my-1">
                    속력: <strong>{vessel.speedKts} kts</strong> | 침로:{' '}
                    <strong>
                      {vessel.headingDeg}° {getCompassDirection16(vessel.headingDeg)}
                    </strong>
                  </div>
                  <div>
                    목적지: <strong>{vessel.destination}</strong> (ETA: {vessel.eta})
                  </div>
                  <div className="mt-1.5">
                    상태:{' '}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold text-white ${
                        vessel.status === 'CRITICAL'
                          ? 'bg-rose-600'
                          : vessel.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
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

      {/* 지도 우상단 범례 (Map Legend Overlay: 모바일 접이식 토글 & 데스크톱 상시 표출) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5">
        {/* 모바일 전용 토글 버튼 (>= 44px 터치 타깃 준수) */}
        <button
          type="button"
          onClick={() => setIsLegendOpen((prev) => !prev)}
          className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold backdrop-blur-md bg-slate-900/90 hover:bg-slate-800 text-marine-cyan border border-marine-border shadow-lg cursor-pointer transition-colors min-h-[44px]"
          data-testid="btn-toggle-legend"
          aria-expanded={isLegendOpen}
          title="지도 범례 토글"
        >
          <Layers className="w-4 h-4 text-marine-cyan" />
          <span>범례</span>
          <span className="text-[10px] text-marine-secondary">{isLegendOpen ? '▲' : '▼'}</span>
        </button>

        {/* 범례 본문 패널: 모바일에서는 isLegendOpen 시 표출, md: 이상에서는 상시 표출 */}
        <div
          className={`p-2 md:p-2.5 rounded-lg text-[11px] md:text-xs shadow-lg flex-col gap-1.5 backdrop-blur-md bg-slate-900/90 border border-marine-border text-marine-secondary transition-all ${
            isLegendOpen ? 'flex' : 'hidden md:flex'
          }`}
          data-testid="marine-map-legend"
        >
          <div className="flex items-center justify-between gap-3 mb-0.5">
            <span className="font-bold text-white text-[11px]">범례 (Legend)</span>
            <button
              type="button"
              onClick={() => setIsLegendOpen(false)}
              className="md:hidden text-slate-400 hover:text-white text-sm w-8 h-8 flex items-center justify-center rounded cursor-pointer"
              aria-label="범례 닫기"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>정상 가동 선박</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>경보 / 주의 선박</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>규제 초과 선박</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
            <span className="w-3 h-0.5 bg-marine-cyan" />
            <span className="text-marine-cyan">선박 침로 벡터 (Heading)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-marine-cyan" />
            <span className="text-marine-cyan">운항 항적 (Track)</span>
          </div>
          {showEcaZone && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
              <span className="w-3 h-2 rounded border border-dashed border-amber-400 bg-amber-400/30" />
              <span className="text-amber-400">ECA 규제해역 (0.1% S)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
