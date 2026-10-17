import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EdgeControlClient,
  EdgeTelemetryResponse,
} from '../src/services/edgeControlClient';

describe('EdgeControlClient', () => {
  let client: EdgeControlClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    client = new EdgeControlClient('/api/edge');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches latest telemetry from edge endpoint', async () => {
    const mockTelemetry: EdgeTelemetryResponse = {
      vessel_id: 'IMO9186467',
      timestamp: '2026-10-18T00:00:00.000Z',
      scrubber_dp: 1.45,
      scrubber_ph: 7.2,
      scrubber_turbidity: 2.1,
      scrubber_so2_co2_ratio: 3.8,
      bwts_filter_dp: 0.35,
      bwts_uv_intensity: 98.5,
      bwts_tro: 1.8,
      controls: {
        emergency_bypass: false,
        backwash_active: false,
        satellite_online: true,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTelemetry,
    });

    const result = await client.fetchLatestTelemetry();
    expect(mockFetch).toHaveBeenCalledWith('/api/edge/telemetry/latest');
    expect(result.vessel_id).toBe('IMO9186467');
    expect(result.scrubber_dp).toBe(1.45);
  });

  it('sends control command payload to edge', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', emergency_bypass: true }),
    });

    const result = await client.sendCommand('BYPASS_TOGGLE', true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/edge/command',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'BYPASS_TOGGLE', value: true }),
      })
    );
    expect(result.status).toBe('success');
  });

  it('throws error when edge returns non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(client.fetchLatestTelemetry()).rejects.toThrow('Edge request failed: 500');
  });
});
