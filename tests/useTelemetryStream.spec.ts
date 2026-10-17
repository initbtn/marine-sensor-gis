import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTelemetryStream } from '../src/hooks/useTelemetryStream';
import { EdgeControlClient, EdgeTelemetryResponse } from '../src/services/edgeControlClient';

describe('useTelemetryStream Hook', () => {
  let mockClient: EdgeControlClient;

  const mockTelemetry: EdgeTelemetryResponse = {
    vessel_id: 'IMO9186467',
    timestamp: '2026-10-18T00:00:00.000Z',
    scrubber_dp: 1.42,
    scrubber_ph: 7.3,
    scrubber_turbidity: 2.2,
    scrubber_so2_co2_ratio: 3.8,
    bwts_filter_dp: 0.36,
    bwts_uv_intensity: 97.8,
    bwts_tro: 1.85,
    controls: {
      emergency_bypass: false,
      backwash_active: false,
      satellite_online: true,
    },
  };

  beforeEach(() => {
    mockClient = {
      basePath: '/api/edge',
      checkHealth: vi.fn().mockResolvedValue({ status: 'healthy', satellite_online: true }),
      fetchLatestTelemetry: vi.fn().mockResolvedValue(mockTelemetry),
      sendCommand: vi.fn().mockResolvedValue({ status: 'success' }),
    } as unknown as EdgeControlClient;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with null telemetry and fetches initial snapshot', async () => {
    const { result } = renderHook(() =>
      useTelemetryStream({ client: mockClient, autoPoll: false })
    );

    expect(result.current.telemetry).toBeNull();
    expect(result.current.isConnected).toBe(false);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.telemetry).toEqual(mockTelemetry);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isSatelliteOnline).toBe(true);
  });

  it('toggles emergency bypass and updates control status', async () => {
    const { result } = renderHook(() =>
      useTelemetryStream({ client: mockClient, autoPoll: false })
    );

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.toggleBypass(true);
    });

    expect(mockClient.sendCommand).toHaveBeenCalledWith('BYPASS_TOGGLE', true);
  });

  it('toggles satellite air-gap state', async () => {
    const { result } = renderHook(() =>
      useTelemetryStream({ client: mockClient, autoPoll: false })
    );

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.toggleSatellite(false);
    });

    expect(mockClient.sendCommand).toHaveBeenCalledWith('SATELLITE_TOGGLE', false);
  });
});
