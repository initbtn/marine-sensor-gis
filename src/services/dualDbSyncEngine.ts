import { sha256 } from 'js-sha256';

export interface TelemetryBufferRecord {
  id: string;
  vesselId: string;
  timestamp: string;
  scrubberDp?: number;
  scrubberPh?: number;
  scrubberTurbidity?: number;
  scrubberSo2Co2Ratio?: number;
  bwtsFilterDp?: number;
  bwtsUvIntensity?: number;
  bwtsTro?: number;
  dataIntegrityHash: string;
  status: 'PENDING' | 'IN_FLIGHT' | 'SYNCED' | 'FAILED';
  createdAt: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: string;
}

export interface DualDbSyncConfig {
  batchSize?: number;
  maxBufferSize?: number;
  uploader: (records: TelemetryBufferRecord[]) => Promise<boolean>;
}

export class DualDbSyncEngine {
  private buffer: TelemetryBufferRecord[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private batchSize: number;
  private maxBufferSize: number;
  private uploader: (records: TelemetryBufferRecord[]) => Promise<boolean>;
  private lastSyncTime?: string;
  private counter: number = 0;

  constructor(config: DualDbSyncConfig) {
    this.batchSize = config.batchSize ?? 50;
    this.maxBufferSize = config.maxBufferSize ?? 5000;
    this.uploader = config.uploader;
  }

  /**
   * Computes standard NIST SHA-256 data integrity hash for IMO MEPC.340(77) / IACS UR E27 compliance
   */
  public computeIntegrityHash(data: Record<string, unknown>): string {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return sha256(serialized);
  }

  /**
   * Queues a telemetry measurement into the local edge buffer with integrity hash
   */
  public queueTelemetry(
    rawRecord: Omit<TelemetryBufferRecord, 'id' | 'status' | 'dataIntegrityHash' | 'createdAt'>
  ): TelemetryBufferRecord {
    this.counter += 1;
    const now = new Date().toISOString();
    const id = `edge_rec_${Date.now()}_${this.counter}`;
    const hash = this.computeIntegrityHash(rawRecord);

    const record: TelemetryBufferRecord = {
      ...rawRecord,
      id,
      dataIntegrityHash: hash,
      status: 'PENDING',
      createdAt: now,
    };

    this.buffer.push(record);
    this.pruneBuffer();

    if (this.isOnline && !this.isSyncing) {
      queueMicrotask(() => {
        this.syncPendingRecords().catch(() => {});
      });
    }

    return { ...record };
  }

  /**
   * Sets the satellite communication link state (air-gap toggle).
   * When reconnected, automatically triggers batch synchronization.
   */
  public async setSatelliteLink(connected: boolean): Promise<SyncResult> {
    this.isOnline = connected;
    if (connected) {
      return await this.syncPendingRecords();
    }
    return { success: true, syncedCount: 0 };
  }

  /**
   * Flushes all pending records in batches to the cloud database with concurrency mutex lock
   */
  public async syncPendingRecords(): Promise<SyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;
    let totalSynced = 0;

    try {
      while (this.isOnline) {
        const pending = this.buffer.filter((r) => r.status === 'PENDING');
        if (pending.length === 0) {
          break;
        }

        const chunk = pending.slice(0, this.batchSize);
        chunk.forEach((rec) => {
          rec.status = 'IN_FLIGHT';
        });

        try {
          const ok = await this.uploader(chunk);
          if (ok) {
            chunk.forEach((rec) => {
              rec.status = 'SYNCED';
            });
            totalSynced += chunk.length;
          } else {
            chunk.forEach((rec) => {
              rec.status = 'PENDING';
            });
            return {
              success: false,
              syncedCount: totalSynced,
              error: 'Uploader returned false',
            };
          }
        } catch (err: unknown) {
          chunk.forEach((rec) => {
            rec.status = 'PENDING';
          });
          const errorMsg = err instanceof Error ? err.message : String(err);
          return {
            success: false,
            syncedCount: totalSynced,
            error: errorMsg,
          };
        }
      }

      this.lastSyncTime = new Date().toISOString();
      return { success: true, syncedCount: totalSynced };
    } finally {
      this.isSyncing = false;
      this.pruneBuffer();
    }
  }

  /**
   * Prunes synced records if buffer exceeds maxBufferSize to prevent memory leaks
   */
  private pruneBuffer(): void {
    if (this.buffer.length > this.maxBufferSize) {
      // Retain all PENDING and IN_FLIGHT, drop oldest SYNCED records
      const excess = this.buffer.length - this.maxBufferSize;
      let dropped = 0;
      this.buffer = this.buffer.filter((r) => {
        if (dropped < excess && r.status === 'SYNCED') {
          dropped += 1;
          return false;
        }
        return true;
      });
    }
  }

  /**
   * Returns current statistics of the edge buffer and satellite link
   */
  public getQueueStats(): {
    pendingCount: number;
    inFlightCount: number;
    syncedCount: number;
    totalBufferSize: number;
    isOnline: boolean;
    lastSyncTime?: string;
  } {
    const pendingCount = this.buffer.filter((r) => r.status === 'PENDING').length;
    const inFlightCount = this.buffer.filter((r) => r.status === 'IN_FLIGHT').length;
    const syncedCount = this.buffer.filter((r) => r.status === 'SYNCED').length;

    return {
      pendingCount,
      inFlightCount,
      syncedCount,
      totalBufferSize: this.buffer.length,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Convenience helper to return pending count
   */
  public getQueueLength(): number {
    return this.getQueueStats().pendingCount;
  }

  /**
   * Convenience helper to flush sync queue
   */
  public async flushSyncQueue(): Promise<SyncResult> {
    return this.syncPendingRecords();
  }

  /**
   * Convenience helper to enqueue telemetry from UI
   */
  public enqueueRecord(data: {
    vessel_id: string;
    sox_ppm?: number;
    ph_inlet?: number;
    ph_discharge?: number;
    turbidity_ftu?: number;
    bwts_flow_rate_m3h?: number;
    bwts_tro_ppm?: number;
  }): TelemetryBufferRecord {
    return this.queueTelemetry({
      vesselId: data.vessel_id,
      timestamp: new Date().toISOString(),
      scrubberSo2Co2Ratio: data.sox_ppm,
      scrubberPh: data.ph_discharge,
      scrubberTurbidity: data.turbidity_ftu,
      bwtsTro: data.bwts_tro_ppm,
    });
  }
}

/**
 * Global singleton instance for UI & application use
 */
export const dualDbSyncEngine = new DualDbSyncEngine({
  uploader: async () => true,
});
