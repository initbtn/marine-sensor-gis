import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  CircleMarker,
  Circle,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { VesselInfo, Position } from '../../types/telemetry';
import { BallastRecord } from '../../types/ballast';
import { DEFAULT_VESSEL_TRACKS, getCompassDirection16 } from '../../services/mockTelemetry';
import { Compass, Crosshair, Layers, Droplets } from 'lucide-react';

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

// 평형수 주입(Uptake: 파랑/인입) 및 배출(Discharge: 청록/배출) 전용 GIS 마커 아이콘
export const createBallastIcon = (type: 'UPTAKE' | 'DISCHARGE' | 'CIRCULATION') => {
  const isUptake = type === 'UPTAKE';
  const isDischarge = type === 'DISCHARGE';
  const bgColor = isUptake ? '#2563EB' : isDischarge ? '#059669' : '#D97706';
  const symbol = isUptake ? '⬇' : isDischarge ? '⬆' : '🔄';
  const label = isUptake ? '주입' : isDischarge ? '배출' : '순환';
  const size = 30;

  return L.divIcon({
    className: 'custom-ballast-marker',
    html: `
      <div style="width: ${size}px; height: ${size}px; background-color: ${bgColor}; border: 2px solid #FFFFFF; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #FFFFFF; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.6); cursor: pointer;">
        <span style="font-size: 13px; line-height: 1;">${symbol}</span>
        <span style="font-size: 8px; line-height: 1; margin-top: 1px;">${label}</span>
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

export const MapViewController: React.FC<MapViewControllerProps> = ({
  selectedVessel,
  vessels,
  fitFleetTrigger,
  focusTrigger,
}) => {
  const map = useMap();
  const prevVesselIdRef = React.useRef<string | undefined>(selectedVessel?.id);

  React.useEffect(() => {
    if (!selectedVessel) return;
    map.flyTo([selectedVessel.position.lat, selectedVessel.position.lng], 8, {
      duration: 1.2,
    });
    prevVesselIdRef.current = selectedVessel.id;
  }, [selectedVessel?.id, focusTrigger, map]);

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
  ballastRecords?: BallastRecord[];
  showBallastLayer?: boolean;
  onOpenBallastModal?: () => void;
}

export const MarineMap: React.FC<MarineMapProps> = ({
  vessels,
  selectedVessel,
  onSelectVessel,
  trackHistory = [],
  showEcaZone = true,
  ballastRecords = [],
  showBallastLayer = true,
  onOpenBallastModal,
}) => {
  const [fitFleetTrigger, setFitFleetTrigger] = React.useState(0);
  const [focusTrigger, setFocusTrigger] = React.useState(0);
  const [isLegendOpen, setIsLegendOpen] = React.useState(false);
  const [isBallastVisible, setIsBallastVisible] = React.useState(showBallastLayer);

  const center: [number, number] = selectedVessel
    ? [selectedVessel.position.lat, selectedVessel.position.lng]
    : [35.1, 129.04]; // Busan port default

  const activeTrack: Position[] =
    trackHistory && trackHistory.length > 1
      ? trackHistory
      : selectedVessel && DEFAULT_VESSEL_TRACKS[selectedVessel.id]
      ? DEFAULT_VESSEL_TRACKS[selectedVessel.id]
      : [];

  // 현재 선택된 선박에 해당하는 평형수 기록 필터링 (선택 없으면 전체 표출)
  const displayBallastRecords = selectedVessel
    ? ballastRecords.filter((r) => r.vesselId === selectedVessel.id)
    : ballastRecords;

  return (
    <div
      className="marine-map-container relative rounded-xl overflow-hidden shadow-xl w-full h-full min-h-[480px] border border-marine-border bg-marine-app"
      data-testid="marine-map"
    >
      {/* 맵 상단 좌측: 선단 뷰포트 & 평형수 이력 조작 컨트롤 바 */}
      <div className="absolute top-3 left-14 z-[1000] flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setFitFleetTrigger((prev) => prev + 1)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md bg-slate-900/90 hover:bg-slate-800 text-marine-cyan border border-marine-border shadow-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          data-testid="btn-fit-fleet"
          title="모든 선박이 한 화면에 보이도록 바운드 자동 맞춤"
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
        {/* 평형수 기록부(BWRB) 모달 열기 버튼 */}
        {onOpenBallastModal && (
          <button
            type="button"
            onClick={onOpenBallastModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-500/50 shadow-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            data-testid="btn-open-ballast-modal"
            title="IMO BWM D-2 선박평형수관리기록부(BWRB) 상세 열람"
          >
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>평형수 기록부</span>
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

        {/* 2. 평형수 주입(보충) 및 배출 공간 시각화 (BWRB Spatial Markers & Operation Circles) */}
        {isBallastVisible &&
          displayBallastRecords.map((b) => {
            const isUptake = b.operationType === 'UPTAKE';
            const isDischarge = b.operationType === 'DISCHARGE';
            const circleColor = isUptake ? '#3B82F6' : isDischarge ? '#10B981' : '#F59E0B';

            return (
              <React.Fragment key={`ballast-group-${b.recordId}`}>
                {/* 작업 반경 시각화 서클 */}
                <Circle
                  center={[b.latitude, b.longitude]}
                  radius={isUptake ? 3500 : 2500}
                  pathOptions={{
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
                {/* 작업 지점 핀 마커 */}
                <Marker
                  position={[b.latitude, b.longitude]}
                  icon={createBallastIcon(b.operationType)}
                  data-marker-type="ballast"
                >
                  <Tooltip direction="top" offset={[0, -15]} opacity={0.95}>
                    <div className="text-[11px] font-bold">
                      <span className={isUptake ? 'text-blue-600' : 'text-emerald-600'}>
                        [{isUptake ? '평형수 주입/보충' : isDischarge ? '평형수 배출' : '순환 소독'}]
                      </span>{' '}
                      <span>{b.volumeM3.toLocaleString()} m³</span>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-1.5 text-xs text-slate-800 min-w-[210px]" data-testid="ballast-popup">
                      <div className="flex items-center justify-between border-b pb-1 mb-1">
                        <span className="font-bold text-sm text-slate-900">{b.recordId}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                            isUptake ? 'bg-blue-600' : isDischarge ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        >
                          {isUptake ? 'UPTAKE (주입)' : isDischarge ? 'DISCHARGE (배출)' : 'CIRCULATION'}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mb-1">
                        선박: <strong>{b.vesselName}</strong> ({b.vesselId})
                      </div>
                      <div className="text-slate-700 mb-1">
                        위치: <strong>{b.locationName}</strong>
                      </div>
                      <div className="text-slate-700 mb-1">
                        좌표: <span className="font-mono">{b.latitude.toFixed(3)}°N, {b.longitude.toFixed(3)}°E</span>
                      </div>
                      <div className="text-slate-700 mb-1">
                        대상 탱크: <strong>{b.tankName}</strong>
                      </div>
                      <div className="text-slate-700 mb-1">
                        처리 용량: <strong>{b.volumeM3.toLocaleString()} m³</strong> ({b.flowRateM3h} m³/h)
                      </div>
                      <div className="text-slate-700 mb-1">
                        소독 TRO: <strong className={b.troPpm < 0.2 ? 'text-emerald-600' : 'text-rose-600'}>{b.troPpm} ppm</strong> (기준 &lt; 0.2)
                      </div>
                      <div className="text-slate-500 text-[10px] mt-1 pt-1 border-t">
                        완료 일시: {new Date(b.completedAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* 3. IEC 62288 전방 침로/속력 벡터 (Speed & Heading Leader Lines) */}
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

        {/* 4. 선박 위치 마커 표출 */}
        {vessels.map((vessel) => {
          const isSelected = selectedVessel?.id === vessel.id;
          return (
            <Marker
              key={vessel.id}
              position={[vessel.position.lat, vessel.position.lng]}
              icon={createVesselIcon(vessel.status, isSelected, vessel.headingDeg)}
              data-marker-type="vessel"
              data-vessel-id={vessel.id}
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

      {/* 지도 우상단 범례 & 평형수 레이어 토글 */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5">
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

          {/* 평형수 레이어 온/오프 토글 및 범례 */}
          <div className="pt-1 border-t border-slate-700/60">
            <label className="flex items-center justify-between gap-2 cursor-pointer hover:text-white">
              <span className="font-semibold text-blue-300 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                평형수 작업 지점
              </span>
              <input
                type="checkbox"
                checked={isBallastVisible}
                onChange={(e) => setIsBallastVisible(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                data-testid="chk-ballast-layer"
              />
            </label>
            {isBallastVisible && (
              <div className="mt-1 flex flex-col gap-1 pl-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">⬇</span>
                  <span className="text-blue-300">평형수 주입/보충 지점</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">⬆</span>
                  <span className="text-emerald-300">평형수 처리배출 지점</span>
                </div>
              </div>
            )}
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
