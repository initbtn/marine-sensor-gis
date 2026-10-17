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
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: string;
}

export interface DualDbSyncConfig {
  batchSize?: number;
  uploader: (records: TelemetryBufferRecord[]) => Promise<boolean>;
}

/**
 * Pure TypeScript SHA-256 implementation (zero external dependency, works in Node and Browser)
 */
function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < ascii.length; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= charCode << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);

    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

export class DualDbSyncEngine {
  private buffer: TelemetryBufferRecord[] = [];
  private isOnline: boolean = true;
  private batchSize: number;
  private uploader: (records: TelemetryBufferRecord[]) => Promise<boolean>;
  private lastSyncTime?: string;
  private counter: number = 0;

  constructor(config: DualDbSyncConfig) {
    this.batchSize = config.batchSize ?? 50;
    this.uploader = config.uploader;
  }

  /**
   * Computes SHA-256 data integrity hash for IMO MEPC.340(77) / IACS UR E27 compliance
   */
  public computeIntegrityHash(data: Record<string, unknown>): string {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return sha256Hex(serialized);
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

    if (this.isOnline) {
      this.syncPendingRecords().catch(() => {});
    }

    return record;
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
   * Flushes all pending records in batches to the cloud database
   */
  public async syncPendingRecords(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: true, syncedCount: 0 };
    }

    const pending = this.buffer.filter((r) => r.status === 'PENDING');
    if (pending.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    let totalSynced = 0;

    for (let i = 0; i < pending.length; i += this.batchSize) {
      const chunk = pending.slice(i, i + this.batchSize);
      try {
        const ok = await this.uploader(chunk);
        if (ok) {
          chunk.forEach((rec) => {
            rec.status = 'SYNCED';
          });
          totalSynced += chunk.length;
        } else {
          return {
            success: false,
            syncedCount: totalSynced,
            error: 'Uploader returned false',
          };
        }
      } catch (err: unknown) {
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
  }

  /**
   * Returns current statistics of the edge buffer and satellite link
   */
  public getQueueStats(): {
    pendingCount: number;
    syncedCount: number;
    isOnline: boolean;
    lastSyncTime?: string;
  } {
    const pendingCount = this.buffer.filter((r) => r.status === 'PENDING').length;
    const syncedCount = this.buffer.filter((r) => r.status === 'SYNCED').length;

    return {
      pendingCount,
      syncedCount,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
    };
  }
}
