import { describe, it, expect } from 'vitest';
import { ballastRecordService, INITIAL_BALLAST_RECORDS } from '../src/services/ballastRecordService';
import { BallastRecord } from '../src/types/ballast';

describe('BallastRecordService (IMO BWM D-2 BWRB Lifecycle Tracker)', () => {
  it('기본 평형수 기록 목록을 정상 반환해야 한다', () => {
    const records = ballastRecordService.getRecords();
    expect(records.length).toBe(INITIAL_BALLAST_RECORDS.length);
  });

  it('UPTAKE(보충/주입) 작업 유형 필터링이 정확해야 한다', () => {
    const uptakes = ballastRecordService.getRecords({ operationType: 'UPTAKE' });
    expect(uptakes.length).toBeGreaterThan(0);
    expect(uptakes.every((r) => r.operationType === 'UPTAKE')).toBe(true);
  });

  it('DISCHARGE(배출) 작업 유형 필터링이 정확해야 한다', () => {
    const discharges = ballastRecordService.getRecords({ operationType: 'DISCHARGE' });
    expect(discharges.length).toBeGreaterThan(0);
    expect(discharges.every((r) => r.operationType === 'DISCHARGE')).toBe(true);
  });

  it('특정 선박(VSL-001) 기준 기록 조회가 정확해야 한다', () => {
    const vsl1Records = ballastRecordService.getRecords({ vesselId: 'VSL-001' });
    expect(vsl1Records.length).toBe(3);
    expect(vsl1Records.every((r) => r.vesselId === 'VSL-001')).toBe(true);
  });

  it('요약 통계(총 주입량, 총 배출량, 규제 준수율)가 정확히 계산되어야 한다', () => {
    const stats = ballastRecordService.getSummaryStats('VSL-001');
    expect(stats.totalUptakeVolumeM3).toBe(2450);
    expect(stats.totalDischargeVolumeM3).toBe(980);
    expect(stats.totalOperationsCount).toBe(3);
    expect(stats.complianceRatePercent).toBe(100);
    expect(stats.averageTroPpm).toBeLessThan(0.2); // IMO TRO 규제치 < 0.2 ppm 만족
  });

  it('신규 평형수 기록 추가 시 목록 최상단에 반영되어야 한다', () => {
    const newRecord: BallastRecord = {
      recordId: 'BWRB-TEST-999',
      vesselId: 'VSL-001',
      vesselName: 'PANAMAX PIONEER',
      operationType: 'DISCHARGE',
      startedAt: '2026-11-01T10:00:00Z',
      completedAt: '2026-11-01T11:00:00Z',
      latitude: 34.500,
      longitude: 129.000,
      locationName: '대한해협 남단',
      tankName: 'Forepeak Ballast Tank',
      volumeM3: 500,
      flowRateM3h: 500,
      troPpm: 0.05,
      uvIntensityWm2: 300,
      status: 'COMPLIANT',
      operatorId: 'usr_eng_test',
    };

    ballastRecordService.addRecord(newRecord);
    const updated = ballastRecordService.getRecords({ vesselId: 'VSL-001' });
    expect(updated[0].recordId).toBe('BWRB-TEST-999');
  });
});
