/**
 * EcoMarine GIS 해양 관제 전용 고대비 다크 테마 디자인 토큰 및 IMO/선급 임계치 상수
 */

export const MarineTheme = {
  colors: {
    bgPrimary: '#0B132B',       // 관제실 최적화 심해 네이비 (메인 배경)
    bgSecondary: '#1C2541',     // 보조 배경 / 사이드바
    bgCard: '#1E293B',          // 패널 및 위젯 카드 배경
    bgCardHover: '#2A374A',     // 카드 마우스 호버
    border: 'rgba(0, 245, 212, 0.15)', // 시안 반투명 보더
    borderHover: 'rgba(0, 245, 212, 0.4)',
    
    // 상태 및 규제 색상 (IMO/선급 표준 매핑)
    ecoCyan: '#00F5D4',         // 정상 / 기준 충족 (Normal / Compliant)
    ecoCyanMuted: '#48CAE4',    // 보조 시안
    warningAmber: '#FF9F1C',    // 경계 / 주의 (Warning)
    criticalCrimson: '#E71D36', // 규제 위반 / 비상 트립 (Critical)
    infoBlue: '#00B4D8',        // 일반 정보 (Info)

    // 텍스트 계층 (7:1 고대비 가독성)
    textPrimary: '#F8F9FA',     // 메인 수치 및 타이틀
    textSecondary: '#94A3B8',   // 라벨 및 설명 텍스트
    textMuted: '#64748B',       // 비활성 텍스트
  },

  // IMO MARPOL Annex VI, BWM D-2, MEPC.340(77) 선급 공식 규제 임계치
  thresholds: {
    // 1. Scrubber (MARPOL VI MEPC.340(77))
    soxGlobalPpm: 21.7,         // 일반 해역 황산화물 허용 한계
    soxEcaPpm: 4.3,             // 배출규제해역(ECA) 황산화물 허용 한계
    so2Co2RatioEca: 4.3,        // ECA SO2/CO2 비율 규제치
    so2Co2RatioGlobal: 21.7,    // Global SO2/CO2 비율 규제치
    cemsDriftMaxPct: 2.0,       // CEMS 24h 영점/스팬 최대 허용 드리프트율 (%)
    
    washwaterPhMin: 6.5,        // 선외 배출 세정수 최소 허용 pH (해양 산성화 방지)
    washwaterPhCritical: 4.0,   // 긴급 차단(Trip) pH
    turbidityMaxNtu: 25.0,      // 세정수 최대 허용 탁도 상승폭 (NTU)
    pahMaxPpb: 50.0,            // 최대 허용 PAH 농도 (ppb)
    washwaterTempMaxRiseC: 60.0,// 최대 허용 온도 상승폭 (°C)
    
    // 2. BWTS (BWM Reg. D-2)
    filterDpBackwashBar: 1.0,   // 평형수 여과기 자동 역세척 개시 차압
    filterDpAlarmBar: 1.5,      // 평형수 여과기 막힘 경보 차압
    uvIntensityMinWm2: 250.0,   // 최소 살균 유효 UV 조사 강도 (W/m²)
    uvChamberTempMaxC: 65.0,    // UV 챔버 과열 셧다운 온도 (°C)
    uvLampMaxHours: 2000,       // UV 램프 교체 권고 누적 가동시간
    troMaxPpm: 0.1,             // 배출 평형수 최대 잔류산화제 농도 (ppm)
    
    // 3. Compliance & Audit Target
    complianceRateTargetPct: 99.5, // 선급 요구 당월 환경 준수율 목표 (%)
    edgeBufferMinDays: 7,          // 선급 IACS UR E26/E27 최소 로컬 버퍼 일수
  },
} as const;
