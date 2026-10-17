import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DualDbSyncEngine,
  TelemetryBufferRecord,
  SyncResult,
} from '../src/services/dualDbSyncEngine';
import { sha256 } from 'js-sha256';

describe('DualDbSyncEngine (Store-and-Forward Engine)', () => {
  let engine: DualDbSyncEngine;
  let mockUploader: ReturnType<typeof vi.fn>;

  const sampleRecord: Omit<TelemetryBufferRecord, 'id' | 'status' | 'dataIntegrityHash' | 'createdAt'> = {
    vesselId: 'IMO9186467',
    timestamp: '2026-10-18T00:00:00.000Z',
    scrubberDp: 1.45,
    scrubberPh: 7.2,
    scrubberTurbidity: 2.1,
    scrubberSo2Co2Ratio: 3.8,
    bwtsFilterDp: 0.35,
    bwtsUvIntensity: 98.5,
    bwtsTro: 1.8,
  };

  beforeEach(() => {
    mockUploader = vi.fn().mockResolvedValue(true);
    engine = new DualDbSyncEngine({
      batchSize: 5,
      maxBufferSize: 20,
      uploader: mockUploader,
    });
  });

  it('generates standard NIST SHA-256 data integrity hash upon queuing record', () => {
    const record = engine.queueTelemetry(sampleRecord);
    expect(record.id).toBeDefined();
    expect(record.status).toBe('PENDING');
    expect(record.dataIntegrityHash).toBeDefined();
    expect(record.dataIntegrityHash.length).toBe(64);

    // Verify against standard NIST reference sha256
    const serialized = JSON.stringify(sampleRecord, Object.keys(sampleRecord).sort());
    const expectedNistHash = sha256(serialized);
    expect(record.dataIntegrityHash).toBe(expectedNistHash);
  });

  it('buffers records when satellite link is offline (air-gap simulation)', async () => {
    engine.setSatelliteLink(false);

    engine.queueTelemetry(sampleRecord);
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:01.000Z' });

    const stats = engine.getQueueStats();
    expect(stats.isOnline).toBe(false);
    expect(stats.pendingCount).toBe(2);
    expect(stats.syncedCount).toBe(0);
    expect(mockUploader).not.toHaveBeenCalled();
  });

  it('automatically flushes pending buffer when satellite link reconnects', async () => {
    engine.setSatelliteLink(false);

    engine.queueTelemetry(sampleRecord);
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:01.000Z' });
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:02.000Z' });

    expect(engine.getQueueStats().pendingCount).toBe(3);

    const syncResult: SyncResult = await engine.setSatelliteLink(true);

    expect(syncResult.success).toBe(true);
    expect(syncResult.syncedCount).toBe(3);
    expect(mockUploader).toHaveBeenCalledTimes(1);

    const stats = engine.getQueueStats();
    expect(stats.isOnline).toBe(true);
    expect(stats.pendingCount).toBe(0);
    expect(stats.syncedCount).toBe(3);
  });

  it('splits large offline queues into batches according to batchSize', async () => {
    engine.setSatelliteLink(false);

    for (let i = 0; i < 12; i++) {
      engine.queueTelemetry({
        ...sampleRecord,
        timestamp: `2026-10-18T00:00:${i.toString().padStart(2, '0')}.000Z`,
      });
    }

    expect(engine.getQueueStats().pendingCount).toBe(12);

    const syncResult = await engine.setSatelliteLink(true);

    expect(syncResult.success).toBe(true);
    expect(syncResult.syncedCount).toBe(12);
    expect(mockUploader).toHaveBeenCalledTimes(3);
    expect(engine.getQueueStats().pendingCount).toBe(0);
  });

  it('prevents duplicate upload race conditions when rapidly queueing while online', async () => {
    const uploadedIds: string[] = [];
    mockUploader.mockImplementation(async (records: TelemetryBufferRecord[]) => {
      records.forEach((r) => uploadedIds.push(r.id));
      await new Promise((r) => setTimeout(r, 20));
      return true;
    });

    // Rapidly queue 3 records
    engine.queueTelemetry(sampleRecord);
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:01.000Z' });
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:02.000Z' });

    // Wait for in-flight sync to complete
    await new Promise((r) => setTimeout(r, 100));

    // Must not have duplicate IDs
    const uniqueIds = new Set(uploadedIds);
    expect(uploadedIds.length).toBe(uniqueIds.size);
  });

  it('prunes oldest synced records when exceeding maxBufferSize', async () => {
    engine.setSatelliteLink(false);

    // Queue 25 records when maxBufferSize is 20
    for (let i = 0; i < 25; i++) {
      engine.queueTelemetry({
        ...sampleRecord,
        timestamp: `2026-10-18T00:00:${i.toString().padStart(2, '0')}.000Z`,
      });
    }

    await engine.setSatelliteLink(true);

    const stats = engine.getQueueStats();
    expect(stats.totalBufferSize).toBeLessThanOrEqual(20);
    expect(stats.pendingCount).toBe(0);
  });

  it('keeps records in PENDING status if uploader fails', async () => {
    mockUploader.mockRejectedValueOnce(new Error('Satellite transmission timeout'));

    engine.setSatelliteLink(false);
    engine.queueTelemetry(sampleRecord);

    const syncResult = await engine.setSatelliteLink(true);

    expect(syncResult.success).toBe(false);
    expect(syncResult.error).toContain('Satellite transmission timeout');
    expect(engine.getQueueStats().pendingCount).toBe(1);
    expect(engine.getQueueStats().syncedCount).toBe(0);
  });
});
