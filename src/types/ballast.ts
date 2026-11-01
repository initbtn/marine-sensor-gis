// src/types/ballast.ts

/**
 * IMO BWM Convention Reg. B-2 선박평형수관리기록부(BWRB) 데이터 타입 정의
 */

export type BallastOperationType = 'UPTAKE' | 'DISCHARGE' | 'CIRCULATION';

export type ComplianceStatus = 'COMPLIANT' | 'VIOLATION';

export interface BallastRecord {
  recordId: string;
  vesselId: string;
  vesselName: string;
  operationType: BallastOperationType;
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
  latitude: number;
  longitude: number;
  locationName: string; // e.g. "부산항 신항 4부두", "대한해협 서수로 외해"
  tankName: string; // e.g. "3P/3S Ballast Tank", "Forepeak Tank"
  volumeM3: number; // m³
  flowRateM3h: number; // m³/h
  troPpm: number; // Total Residual Oxidants (< 0.2 ppm 규제)
  uvIntensityWm2: number; // UV 살균 강도 (>= 250 W/m²)
  status: ComplianceStatus;
  operatorId: string; // 익명화된 기관사/작업자 식별자 (Zero-PII)
  remarks?: string;
}

export interface BallastFilterOptions {
  operationType?: BallastOperationType | 'ALL';
  vesselId?: string;
  tankName?: string;
  status?: ComplianceStatus | 'ALL';
}

export interface BallastSummaryStats {
  totalUptakeVolumeM3: number;
  totalDischargeVolumeM3: number;
  totalOperationsCount: number;
  complianceRatePercent: number;
  averageTroPpm: number;
}
