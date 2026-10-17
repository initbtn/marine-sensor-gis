import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DualDbSyncEngine,
  TelemetryBufferRecord,
  SyncResult,
} from '../src/services/dualDbSyncEngine';

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
      uploader: mockUploader,
    });
  });

  it('generates SHA-256 data integrity hash upon queuing record', () => {
    const record = engine.queueTelemetry(sampleRecord);
    expect(record.id).toBeDefined();
    expect(record.status).toBe('PENDING');
    expect(record.dataIntegrityHash).toBeDefined();
    expect(record.dataIntegrityHash.length).toBe(64); // SHA-256 hex string length
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

    // Queue 3 records while offline
    engine.queueTelemetry(sampleRecord);
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:01.000Z' });
    engine.queueTelemetry({ ...sampleRecord, timestamp: '2026-10-18T00:00:02.000Z' });

    expect(engine.getQueueStats().pendingCount).toBe(3);

    // Reconnect satellite link
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

    // Queue 12 records with batchSize = 5 -> should result in 3 batches (5 + 5 + 2)
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
