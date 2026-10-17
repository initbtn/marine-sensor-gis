# 해양 친환경 설비 데이터 시각화 분류 기준 및 의사결정 매트릭스 (Data Visualization Decision Matrix)

> **문서 상태**: APPROVED (SSOT 정본)  
> **기반 표준**: Financial Times Visual Vocabulary, From Data to Viz, IBM Carbon Data Viz, Grafana & Apache Superset  
> **프로젝트**: EcoMarine Control Platform (`marine-sensor-gis`)  
> **버전**: v1.0.0

---

## 1. 개요 및 설계 원칙 (Overview & Principles)

해양 친환경 관제 시스템의 시각화는 단순한 데이터 출력이 아니라, **"선박 기관사와 관제관이 0.1초 만에 이상을 판단하고, 선급 검사관이 법적 준수를 감사할 수 있도록 돕는 인지적 증폭 장치(Cognitive Amplifier)"**입니다.

### 4대 시각화 설계 원칙
1. **목적 중심 차트 선정 (Intent-Driven Selection)**: "데이터의 물리적 형태"가 아닌 **"사용자가 내릴 결정(비상 차단, 항로 변경, 부품 교체, 법적 제출)"**에 따라 시각화 타입을 결정합니다.
2. **0-Click 가시성 (Zero-Click Situational Awareness)**: 핵심 규제 지표(SOx ppm, pH, 차압)는 드릴다운 없이 한눈에 정상/경보를 식별할 수 있어야 합니다.
3. **선급 임계치 시각적 고정 (Threshold Anchoring)**: 모든 계측 차트에는 IMO 법적 상한/하한선(MarkLine/Band)이 시각적 닻(Anchor)으로 항상 렌더링되어야 합니다.
4. **글레어 프리 고대비 (Anti-Glare High Contrast)**: 선교(Bridge) 및 ECR 야간 시야 보호를 위한 고대비 다크 테마(심해 네이비 `#0B132B`)를 엄격히 적용합니다.

---

## 2. 8대 시각화 패밀리 분류 체계 (8 Visualization Families)

글로벌 데이터 시각화 표준(FT Visual Vocabulary / IBM Carbon)을 기반으로 해양 텔레메트리에 최적화된 8대 차트 패밀리를 정의합니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   8대 해양 데이터 시각화 패밀리                         │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 1. Threshold Gauge │ 2. Time-Series     │ 3. Multi-Axis Radar          │
│ (임계치 원형 게이지)│ (시계열 펄스 파형) │ (5축 설비 건전성 진단)       │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 4. Correlation XY  │ 5. Matrix Heatmap  │ 6. Spatio-Temporal GIS       │
│ (유량-차압 산점도) │ (시간-요일 위반분포│ (선수 회전 마커 + ECA 지도)  │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 7. Composition Bar │ 8. Process Mimic   │                              │
│ (선단 도넛/배출 막대│ (P&ID 공정 흐름선) │                              │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 3. 세부 시각화 타입별 명세 및 렌더링 기준

### ① 임계치 게이지 패밀리 (Threshold & Compliance Gauges)
* **적용 목적**: 실시간 측정값이 법적 허용 범위 내에 있는지 0초 만에 인지.
* **차트 세부 유형**:
  1. **Radial Circular Gauge (원형 게이지)**: 210° ~ -30° 부채꼴 회전 바늘 게이지. 
     - SOx용 (0~30 ppm): ECA 4.3ppm / Global 21.7ppm 마크라인 밴드 분할.
     - pH용 (0~14 pH): 4.0(비상차단 Red), 6.5(선외배출 안전선 Yellow/Green), 8.5 분할.
  2. **Linear Bullet Gauge (수평 불릿 게이지)**: 정격 용량(TRC) 대비 현재 펌프 유량(%) 비율 표시.
  3. **Semi-Donut Progress (반원형 도넛 게이지)**: 당월 IMO 종합 준수율 % (99.5% 달성 목표).

### ② 시계열 트렌드 패밀리 (Time-Series & Dynamics)
* **적용 목적**: 센서의 단기 급변 스파이크(Spike) 감지 및 장기 드리프트(Drift) 분석.
* **차트 세부 유형**:
  1. **Multi-Axis Line Chart (다축 시계열 라인)**: 
     - 좌측 Y축: SOx ppm (0~30)
     - 우측 Y축: 배출수 pH (4~10)
     - 1초 실시간 펄스 파형 렌더링 (최근 60초~10분 윈도우).
  2. **Stepped Area Chart (계단형 영역 차트)**: 가성소다(NaOH) 중화제 펌프 주입량(L/h)과 세정수 공급 유량(m³/h) 간의 단계적 스로틀링 반응 추적.
  3. **Sparkline (인라인 미니 트렌드)**: KPI 카드 내부에서 최근 15분간의 미세 변동 방향(상승/하강) 요약.

### ③ 다변량 건전성 진단 패밀리 (Multi-Variate Diagnostics)
* **적용 목적**: 5대 핵심 부품의 상호 연계 상태를 종합하여 시스템 전체의 건전성(Health)을 진단.
* **차트 세부 유형**:
  1. **5-Axis Radar Chart (오각형 방사형 레이더)**:
     - 축 1: CEMS 센서 신뢰도 (24h 영점/스팬 드리프트 역산 점수)
     - 축 2: 여과기 차압 여유도 (1.5bar 대비 잔여 마진)
     - 축 3: UV 램프 잔여수명 (2,000시간 대비 잔여율)
     - 축 4: 세정수 펌프 효율 (전력 소모량 대비 공급 유량)
     - 축 5: 중화제 제어 안정성 (목표 pH 7.2 유지 오차율)
     - **렌더링**: 선급 100점 점선 다각형(기준선) 위에 현재 측정치(시안색 면)를 오버레이하여 결함 축을 즉시 식별.

### ④ 물리 상관관계 산점도 패밀리 (Correlation & Physical Dynamics)
* **적용 목적**: 장비의 물리 법칙(유체역학)을 벗어나는 이상 징후 조기 포착.
* **차트 세부 유형**:
  1. **Flow vs Pressure Drop Scatter Plot (유량 대비 차압 산점도)**:
     - X축: 평형수 처리 유량 ($m^3/h$)
     - Y축: 여과기 차압 ($\Delta P$, bar)
     - **진단 원리**: 유체역학상 차압은 유량의 제곱에 비례함. 이 정상 포물선 포락선(Envelope)을 위로 벗어나는 점들이 찍히면 **"뻘/해양생물에 의한 필터 조기 막힘"**을 감지.
  2. **3D Bubble Plot (버블 차트)**: 유량(X) × 차압(Y) × 펌프 전력소모량(버블 크기)으로 펌프 모터 과부하 조기 감지.

### ⑤ 이상치 매트릭스 히트맵 패밀리 (Matrix & Anomaly Distribution)
* **적용 목적**: 수천 건의 로그를 보지 않고, 특정 시간대/요일별 운영 결함 패턴을 직관적으로 발견.
* **차트 세부 유형**:
  1. **Temporal Violation Heatmap (24시간 × 7요일 매트릭스)**:
     - X축: 00시 ~ 22시 (2시간 간격 12개 시간 슬롯)
     - Y축: 월요일 ~ 일요일 (7개 행)
     - 셀 색상: 0건(배경 다크), 1건(시안), 2건(앰버), 3건 이상(크림슨).
     - **발견 가능한 실무 패턴**: *"매주 특정 요일 새벽 06~08시 입항 전 감속 구간에서 세정수 유량 조절 실패로 pH 일시 저하"* 패턴을 즉시 발견.

### ⑥ 시공간 해양 GIS 패밀리 (Spatio-Temporal Marine GIS)
* **적용 목적**: 선박의 운항 침로와 환경 규제 해역(ECA) 간의 공간적 관계 관제.
* **차트 세부 유형**:
  1. **Heading-Rotated Vessel Marker**: 선수 침로 각도(`0~359°`)로 실시간 회전하는 선박 심볼. 상태별 색상(정상: 시안, 경보: 앰버, 위반: 크림슨).
  2. **Historical Track Polyline**: 최근 24시간 이동 항적을 점선 폴리라인으로 표시.
  3. **ECA Polygon Overlay**: 부산항 및 대한해협 연안 배출규제해역(SOx 0.1% Zone) 폴리곤을 황색 점선으로 강조.
  4. **Spatial Intersection Alarm**: 선박 위치가 ECA 폴리곤 내로 진입하면 `[ECA ACTIVE]` 배지 자동 점등 및 SOx 게이지 상한선이 `4.3 ppm`으로 자동 스냅 전환.

### ⑦ 선단 구성 및 배출 총량 패밀리 (Composition & Aggregation)
* **적용 목적**: 육상 관제관 대상 전체 선단(Fleet)의 상태 분포 및 환경 규제 영향도 파악.
* **차트 세부 유형**:
  1. **Fleet Status Donut Chart (선단 상태 도넛 차트)**: 정상 운항 선박(초록) vs 주의 선박(노랑) vs 규제 초과 선박(빨강) 비율.
  2. **Cumulative Discharge Bar Chart (누적 배출량 막대 차트)**: 선박별 일간 세정수 배출 톤수(ton) 및 평형수 처리 총량 비교.

### ⑧ 공정 흐름 미믹 패밀리 (Process Flow & HMI Mimic)
* **적용 목적**: 기관실 실무자가 익숙한 P&ID 배관 계장도 흐름 시각화.
* **차트 세부 유형**:
  1. **Flow Pipeline Animation**: 배기가스 인입 ➔ 스크러버 타워 ➔ 세정수 분사 ➔ 선외 배출 배관에 시안색 유동 펄스(CSS Keyframe) 구동.
  2. **Valve & Interlock Indicator**: 정상 운전(Open, 녹색) vs 긴급 차단(Trip, 적색) 밸브 상태 심볼 표시.

---

## 4. 선급 파라미터 ➔ 시각화 의사결정 매트릭스 (Full Decision Matrix)

| 번호 | 선급 계측 파라미터 | 물리 단위 | 선급/IMO 기준치 | 1차 권장 시각화 | 2차 보조 시각화 | 의사결정 근거 (UX Rationale) |
|:---:|---|---|---|---|---|---|
| **1** | **`so2_co2_ratio`** | 비 (Ratio) | ECA: $\le 4.3$<br>Global: $\le 21.7$ | **Radial Gauge** | **Multi-axis Line** | 바늘 각도와 컬러 밴드로 0초 만에 법적 한계 판정 |
| **2** | **`ph_discharge`** | pH | $\ge 6.5$ (선외)<br>$< 4.0$ (긴급차단) | **Dual-band Gauge** | **Process Mimic Valve** | 6.5 안전선과 4.0 차단선을 동시에 표시하고 차단 시 밸브 적색 트립 연동 |
| **3** | **`turbidity_ntu`** | NTU | $\Delta \le 25.0$ | **Metric Card + Trend** | **Bar Chart** | 흡입수 대비 상승폭($\Delta$)을 직관적 델타로 표시 |
| **4** | **`pah_ppb`** | ppb | $\le 50.0$ | **Metric Card + Alert** | **Time-series Line** | 유류 누출 한계선(50ppb) 접근 시 경보 앰버 배지 점등 |
| **5** | **`filter_delta_p_bar`** | bar | $\ge 1.0$ (역세척)<br>$\ge 1.5$ (경보) | **Scatter Plot** | **Linear Bar Gauge** | 유량 대비 차압 곡선 이상점 추적 및 역세척 기동선 표시 |
| **6** | **`uv_intensity_wm2`** | W/m² | $\ge 250.0$ | **Radar Chart (축 3)** | **Metric Card** | 설비 건전성 5축 중 핵심 살균 지표로 통합 평가 |
| **7** | **`tro_sensor_ppm`** | ppm | $\le 0.1$ | **Metric Card** | **Gauge Chart** | 평형수 배출 시 잔류산화제 환경 기준 충족 여부 표시 |
| **8** | **`cems_drift_pct`** | % | $\le \pm 2.0\%$ | **Radar Chart (축 1)** | **Calibration Log Table** | 센서 교정 유효성 평가 및 정기 검사 대비 점수화 |
| **9** | **`ballast_flow_rate`**| m³/h | $\le 100\%$ TRC | **Bullet Chart** | **Scatter Plot (X축)** | 정격 처리용량 대비 현재 유량 비율 및 인터록 감시 |
| **10**| **`vessel_heading`** | deg (°) | $0 \sim 359^\circ$ | **Rotated SVG Marker** | **Compass Rose Widget** | 해양 GIS 지도 상에서 실시간 선수 방향각 회전 렌더링 |
| **11**| **`eca_boundary`** | Lat/Lng | Polygon 내부 여부 | **Leaflet Polygon** | **Status Badge (ECA)** | 황색 점선 해역 오버레이 및 진입 시 임계치 동적 전환 트리거 |
| **12**| **`violation_matrix`** | 건수/시간 | 0건 (목표) | **Calendar Heatmap** | **Electronic Logbook** | 24시간 × 7요일 매트릭스로 반복 결함 시간대 패턴 도출 |
| **13**| **`fleet_status`** | 선박수 | 정상 100% | **Donut Chart** | **Vessel Summary List** | 선단 전체의 정상/주의/위반 분포 한눈에 파악 |
| **14**| **`compliance_rate`** | % | $\ge 99.5\%$ | **Semi-Donut Gauge** | **Audit Summary Box** | 선급 및 IMO 검사관 대상 당월 법적 달성률 증빙 |

---

## 5. 4대 운영 직무별 시각화 위젯 배치 매핑

```
┌────────────────────────────────────────────────────────────────────────┐
│ [1. 🚢 선박 기관사 뷰 (Chief Engineer)]                                  │
│ • 원형 게이지: SOx ppm (0~30), 배출수 pH (4~14)                         │
│ • 1초 고주파 멀티액시스 라인 차트 (SOx & pH 실시간 펄스 파형)             │
│ • P&ID 공정 흐름 미믹 및 실시간 밸브 개폐 상태 인디케이터                 │
│ • ISA-18.2 원클릭 알람 인지(Acknowledge) 콘솔 & 에지 롤링 버퍼 상태 바   │
├────────────────────────────────────────────────────────────────────────┤
│ [2. 🏢 육상 선단 관제관 뷰 (Fleet Operator)]                              │
│ • 전면 Leaflet 해양 GIS 지도 (선수 침로 회전 마커, 24h 항적, ECA 폴리곤)│
│ • 선단 가동 상태 도넛 차트 (정상/주의/위반 선박 분포)                   │
│ • 선단 일일 누적 세정수 배출량 막대 차트 (Bar Chart)                     │
│ • 선택 선박 제원 및 위성 통신 품질(RTT/SNR) 인디케이터                 │
├────────────────────────────────────────────────────────────────────────┤
│ [3. ⚖️ 규제 감사관 뷰 (Compliance Officer)]                             │
│ • IMO 종합 법적 준수율 반원형 게이지 (%) (목표 99.5% 달성선 오버레이)   │
│ • 24시간 × 7요일 규제 위반 매트릭스 히트맵 (이상치 패턴 분석)           │
│ • 선급 공인 전자 기록부 (MARPOL / BWM Electronic Record Book) 테이블    │
│ • 법정 감사 증빙용 무결성 해시 검증 및 CSV 다운로드 버튼                │
├────────────────────────────────────────────────────────────────────────┤
│ [4. 🔧 원격 진단원 뷰 (Pan-Hawk Diagnostic Tech)]                        │
│ • 판호크 5축 설비 건전성 레이더 차트 (CEMS, 차압, UV, 펌프, 중화제)     │
│ • 평형수 유량 대비 필터 차압 상관관계 산점도 (이상치 포락선 감시)       │
│ • 소모품(UV 램프, pH 센서 전극) 잔여 수명 및 교체 권고 예지보전 타임라인│
└────────────────────────────────────────────────────────────────────────┘
```
