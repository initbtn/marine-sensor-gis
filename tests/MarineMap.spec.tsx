import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarineMap } from '../src/components/Map/MarineMap';
import { FullGisPage } from '../src/components/Pages/FullGisPage';
import { INITIAL_VESSELS } from '../src/services/mockTelemetry';
import { useMarineDashboardStore } from '../src/stores/useMarineDashboardStore';

// react-leaflet 및 Leaflet 모킹
const mockFlyTo = vi.fn();
const mockFitBounds = vi.fn();

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="leaflet-map-container">{children}</div>,
  TileLayer: () => <div data-testid="leaflet-tile-layer" />,
  Polygon: ({ children }: any) => <div data-testid="leaflet-polygon">{children}</div>,
  Polyline: () => <div data-testid="leaflet-polyline" />,
  CircleMarker: ({ children }: any) => <div data-testid="leaflet-circle-marker">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="leaflet-tooltip">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="leaflet-popup">{children}</div>,
  Marker: ({ eventHandlers, children, position }: any) => (
    <div
      data-testid="leaflet-marker"
      data-lat={position[0]}
      data-lng={position[1]}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  useMap: () => ({
    flyTo: mockFlyTo,
    fitBounds: mockFitBounds,
    getZoom: () => 7,
  }),
}));

describe('MarineMap & MapViewController GIS Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarineDashboardStore.getState().reset();
  });

  it('기본 맵 컨테이너 및 전체 선단 보기, 추적 버튼이 정상 렌더링되어야 한다', () => {
    render(
      <MarineMap
        vessels={INITIAL_VESSELS}
        selectedVessel={INITIAL_VESSELS[0]}
      />
    );

    expect(screen.getByTestId('marine-map')).toBeInTheDocument();
    expect(screen.getByTestId('btn-fit-fleet')).toBeInTheDocument();
    expect(screen.getByTestId('btn-focus-selected')).toBeInTheDocument();
    expect(screen.getByText('전체 선단 보기')).toBeInTheDocument();
    expect(screen.getByText('PANAMAX PIONEER 추적')).toBeInTheDocument();
  });

  it('선택 선박이 주어지면 map.flyTo가 해당 좌표로 호출되어야 한다', () => {
    const { rerender } = render(
      <MarineMap
        vessels={INITIAL_VESSELS}
        selectedVessel={INITIAL_VESSELS[0]}
      />
    );

    expect(mockFlyTo).toHaveBeenCalledWith(
      [INITIAL_VESSELS[0].position.lat, INITIAL_VESSELS[0].position.lng],
      8,
      expect.objectContaining({ duration: 1.2 })
    );

    // VSL-002 (싱가포르 해협)로 선박 변경
    rerender(
      <MarineMap
        vessels={INITIAL_VESSELS}
        selectedVessel={INITIAL_VESSELS[1]}
      />
    );

    expect(mockFlyTo).toHaveBeenCalledWith(
      [INITIAL_VESSELS[1].position.lat, INITIAL_VESSELS[1].position.lng],
      8,
      expect.objectContaining({ duration: 1.2 })
    );
  });

  it('"전체 선단 보기" 버튼 클릭 시 map.fitBounds가 전 선박 좌표 바운드로 호출되어야 한다', () => {
    render(
      <MarineMap
        vessels={INITIAL_VESSELS}
        selectedVessel={INITIAL_VESSELS[0]}
      />
    );

    const fitBtn = screen.getByTestId('btn-fit-fleet');
    fireEvent.click(fitBtn);

    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        padding: [60, 60],
        maxZoom: 6,
        animate: true,
      })
    );
  });

  it('지도 위의 마커 클릭 시 onSelectVessel 콜백이 올바른 선박 ID로 호출되어야 한다', () => {
    const handleSelectVessel = vi.fn();
    render(
      <MarineMap
        vessels={INITIAL_VESSELS}
        selectedVessel={INITIAL_VESSELS[0]}
        onSelectVessel={handleSelectVessel}
      />
    );

    const markers = screen.getAllByTestId('leaflet-marker');
    expect(markers).toHaveLength(INITIAL_VESSELS.length);

    // 두 번째 마커 (ECO OCEAN, VSL-002) 클릭
    fireEvent.click(markers[1]);
    expect(handleSelectVessel).toHaveBeenCalledWith('VSL-002');
  });

  it('FullGisPage에서 마커 클릭 시 Zustand 스토어의 selectedVesselId가 동기화되어야 한다', () => {
    render(<FullGisPage />);

    expect(screen.getByTestId('full-gis-page')).toBeInTheDocument();
    expect(screen.getByText(/현재 추적선: PANAMAX PIONEER/)).toBeInTheDocument();

    const markers = screen.getAllByTestId('leaflet-marker');
    // VSL-002 마커 클릭
    act(() => {
      fireEvent.click(markers[1]);
    });

    // 스토어 상태 변경 확인
    expect(useMarineDashboardStore.getState().selectedVesselId).toBe('VSL-002');
  });

  it('모바일 반응형: 범례 토글 버튼(btn-toggle-legend)이 렌더링되고 클릭 시 접힘/펼침 상태가 전환되어야 한다', () => {
    render(
      <MarineMap
        vessels={INITIAL_VESSELS}
        selectedVessel={INITIAL_VESSELS[0]}
      />
    );

    const toggleBtn = screen.getByTestId('btn-toggle-legend');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    const legendPanel = screen.getByTestId('marine-map-legend');
    expect(legendPanel.className).toContain('hidden');

    // 토글 버튼 클릭 -> 펼침
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(legendPanel.className).not.toContain('hidden');

    // 닫기 버튼 클릭 -> 다시 접힘
    const closeBtn = screen.getByLabelText('범례 닫기');
    fireEvent.click(closeBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(legendPanel.className).toContain('hidden');
  });
});
