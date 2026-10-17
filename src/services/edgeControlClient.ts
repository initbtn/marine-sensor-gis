export interface EdgeControlsState {
  emergency_bypass: boolean;
  backwash_active: boolean;
  satellite_online: boolean;
}

export interface EdgeTelemetryResponse {
  vessel_id: string;
  timestamp: string;
  scrubber_dp: number;
  scrubber_ph: number;
  scrubber_turbidity: number;
  scrubber_so2_co2_ratio: number;
  bwts_filter_dp: number;
  bwts_uv_intensity: number;
  bwts_tro: number;
  controls: EdgeControlsState;
}

export interface EdgeHealthResponse {
  status: string;
  service: string;
  vessel_id: string;
  satellite_online: boolean;
  controls: {
    emergency_bypass: boolean;
    backwash_active: boolean;
  };
}

export type EdgeCommandType = 'BYPASS_TOGGLE' | 'BACKWASH_TRIGGER' | 'SATELLITE_TOGGLE';

export class EdgeControlClient {
  private basePath: string;

  constructor(basePath: string = '/api/edge') {
    this.basePath = basePath.replace(/\/$/, '');
  }

  /**
   * Checks the health and connectivity status of the edge daemon
   */
  public async checkHealth(): Promise<EdgeHealthResponse> {
    const res = await fetch(`${this.basePath}/health`);
    if (!res.ok) {
      throw new Error(`Edge request failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as EdgeHealthResponse;
  }

  /**
   * Fetches latest telemetry snapshot from the edge sensor simulator
   */
  public async fetchLatestTelemetry(): Promise<EdgeTelemetryResponse> {
    const res = await fetch(`${this.basePath}/telemetry/latest`);
    if (!res.ok) {
      throw new Error(`Edge request failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as EdgeTelemetryResponse;
  }

  /**
   * Sends a downlink command to the edge daemon (bypass valve, backwash, satellite link toggle)
   */
  public async sendCommand(
    command: EdgeCommandType,
    value?: boolean
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.basePath}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, value }),
    });

    if (!res.ok) {
      throw new Error(`Edge command failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }
}

export const defaultEdgeClient = new EdgeControlClient('/api/edge');
