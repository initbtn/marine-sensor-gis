// src/services/ballastRecordService.ts
import { BallastRecord, BallastFilterOptions, BallastSummaryStats } from '../types/ballast';

/**
 * 선박평형수처리장치(BWTS) 연계 선박평형수 기록부(BWRB) 서비스
 * 
 * - IMO BWM D-2 준수 이력 데이터 관리
 * - 보충(주입, Uptake) 및 배출(Discharge) 위치/시간/수량 추적
 */

export const INITIAL_BALLAST_RECORDS: BallastRecord[] = [
  {
    recordId: 'BWRB-2026-001',
    vesselId: 'VSL-001',
    vesselName: 'PANAMAX PIONEER',
    operationType: 'UPTAKE',
    startedAt: '2026-10-31T08:30:00Z',
    completedAt: '2026-10-31T10:45:00Z',
    latitude: 35.085,
    longitude: 128.825,
    locationName: '부산항 신항 4부두 3선석 (Pusan New Port)',
    tankName: '3P/3S Ballast Tank',
    volumeM3: 2450,
    flowRateM3h: 1100,
    troPpm: 0.12,
    uvIntensityWm2: 285,
    status: 'COMPLIANT',
    operatorId: 'usr_eng_8f2a',
    remarks: '컨테이너 양하 작업에 따른 평형수 보충 완료 (GloEn-Patrol Auto-filtration 정상)',
  },
  {
    recordId: 'BWRB-2026-002',
    vesselId: 'VSL-001',
    vesselName: 'PANAMAX PIONEER',
    operationType: 'CIRCULATION',
    startedAt: '2026-11-01T01:15:00Z',
    completedAt: '2026-11-01T02:00:00Z',
    latitude: 34.850,
    longitude: 129.120,
    locationName: '대한해협 남동부 공해상 (Korea Strait International Waters)',
    tankName: '3P/3S Ballast Tank',
    volumeM3: 1200,
    flowRateM3h: 1600,
    troPpm: 0.15,
    uvIntensityWm2: 310,
    status: 'COMPLIANT',
    operatorId: 'usr_eng_8f2a',
    remarks: '항해 중 평형수 순환 2차 소독 처리 완료',
  },
  {
    recordId: 'BWRB-2026-003',
    vesselId: 'VSL-001',
    vesselName: 'PANAMAX PIONEER',
    operationType: 'DISCHARGE',
    startedAt: '2026-11-01T06:00:00Z',
    completedAt: '2026-11-01T07:30:00Z',
    latitude: 34.660,
    longitude: 129.050,
    locationName: '대한해협 서수로 통항분리대 외해 (TSS Western Channel Offshore)',
    tankName: 'Forepeak Ballast Tank',
    volumeM3: 980,
    flowRateM3h: 650,
    troPpm: 0.08,
    uvIntensityWm2: 295,
    status: 'COMPLIANT',
    operatorId: 'usr_eng_3c1d',
    remarks: '트림 조정 목적 감압 배출 완료 (TRO 중화제 주입 정상, < 0.2 ppm 엄격 준수)',
  },
  {
    recordId: 'BWRB-2026-004',
    vesselId: 'VSL-002',
    vesselName: 'HMM PACIFIC',
    operationType: 'UPTAKE',
    startedAt: '2026-10-30T14:00:00Z',
    completedAt: '2026-10-30T16:30:00Z',
    latitude: 34.908,
    longitude: 127.705,
    locationName: '광양항 컨테이너부두 (Gwangyang Port)',
    tankName: '2P/2S Wing Tank',
    volumeM3: 3100,
    flowRateM3h: 1250,
    troPpm: 0.14,
    uvIntensityWm2: 270,
    status: 'COMPLIANT',
    operatorId: 'usr_eng_7e4b',
    remarks: '입항 하역 후 주입 완료',
  },
  {
    recordId: 'BWRB-2026-005',
    vesselId: 'VSL-002',
    vesselName: 'HMM PACIFIC',
    operationType: 'DISCHARGE',
    startedAt: '2026-11-01T04:20:00Z',
    completedAt: '2026-11-01T06:10:00Z',
    latitude: 34.250,
    longitude: 128.550,
    locationName: '남해 외해 지정 배출수역 (South Sea Offshore Designated Zone)',
    tankName: '2P/2S Wing Tank',
    volumeM3: 2150,
    flowRateM3h: 1100,
    troPpm: 0.11,
    uvIntensityWm2: 305,
    status: 'COMPLIANT',
    operatorId: 'usr_eng_7e4b',
    remarks: 'D-2 규정 수역 진입 전 법정 감압 배출',
  },
];

class BallastRecordService {
  private records: BallastRecord[] = [...INITIAL_BALLAST_RECORDS];

  public getRecords(filters?: BallastFilterOptions): BallastRecord[] {
    let result = [...this.records];

    if (!filters) return result;

    if (filters.operationType && filters.operationType !== 'ALL') {
      result = result.filter((r) => r.operationType === filters.operationType);
    }

    if (filters.vesselId) {
      result = result.filter((r) => r.vesselId === filters.vesselId);
    }

    if (filters.tankName) {
      result = result.filter((r) => r.tankName.toLowerCase().includes(filters.tankName!.toLowerCase()));
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((r) => r.status === filters.status);
    }

    return result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  public getSummaryStats(vesselId?: string): BallastSummaryStats {
    const list = vesselId ? this.records.filter((r) => r.vesselId === vesselId) : this.records;

    let totalUptake = 0;
    let totalDischarge = 0;
    let compliantCount = 0;
    let totalTro = 0;

    for (const r of list) {
      if (r.operationType === 'UPTAKE') {
        totalUptake += r.volumeM3;
      } else if (r.operationType === 'DISCHARGE') {
        totalDischarge += r.volumeM3;
      }

      if (r.status === 'COMPLIANT') {
        compliantCount += 1;
      }
      totalTro += r.troPpm;
    }

    const totalCount = list.length;

    return {
      totalUptakeVolumeM3: totalUptake,
      totalDischargeVolumeM3: totalDischarge,
      totalOperationsCount: totalCount,
      complianceRatePercent: totalCount > 0 ? (compliantCount / totalCount) * 100 : 100,
      averageTroPpm: totalCount > 0 ? Number((totalTro / totalCount).toFixed(2)) : 0,
    };
  }

  public addRecord(record: BallastRecord): void {
    this.records.unshift(record);
  }
}

export const ballastRecordService = new BallastRecordService();
