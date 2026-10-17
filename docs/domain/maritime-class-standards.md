# 해양 선급(Classification Society) 및 국제 환경 표준 인증 가이드

이 문서는 `marine-sensor-gis` 프로젝트의 도메인 핵심 지식인 **선급(Classification Society)**, **형식승인(Type Approval)**, **IMO 국제 환경 협약**의 개념과 기준치, 그리고 소프트웨어 시각화 매핑을 정리한 정본(SSOT) 문서입니다.

---

## 1. 선급(Classification Society)이란 무엇인가?

### 1.1. 개념 및 설립 목적
선급(Class)은 선박의 설계, 건조, 운항, 해체에 이르기까지 **선체 구조의 안전성과 탑재 장비의 기술적 신뢰성을 검사하고 공인 인증(증서)을 발급하는 비정부 민간 공인 기술 평가 기관**입니다.
선주, 조선소, 보험사, 금융기관은 선급의 증서(Classification Certificate)가 없는 선박에 대해 보험 인수나 운항 허가를 승인하지 않습니다.

### 1.2. IACS (국제선급연합회) 11개 주요 선급
전 세계 선박의 90% 이상이 **IACS(International Association of Classification Societies)** 소속 선급의 감사를 받습니다:
- **KR (Korean Register)**: 한국선급 (국내 조선·해양 기자재 및 친환경 설비 검사 주관)
- **DNV (Det Norske Veritas)**: 노르웨이-독일선급 (유럽 및 글로벌 최대 규모, 디지털 선급 선도)
- **ABS (American Bureau of Shipping)**: 미국선급 (해양 플랜트 및 미주 항로 특화)
- **LR (Lloyd's Register)**: 영국 로이드선급 (세계 최초 선급, 오랜 역사와 권위)
- **BV (Bureau Veritas)**: 프랑스선급

### 1.3. 선급의 2대 검사 권한
1. **선급 검사 (Classification Survey)**: 선체 강도, 주기관(Main Engine), 보일러, 발전기 등의 기계적 안전성 평가.
2. **법정 검사 대행 (Statutory Survey)**: 기국(Flag State, 예: 대한민국 해양수산부, 파나마, 라이베리아 등)의 법적 권한을 위임받아 **IMO(국제해사기구) 국제 협약 준수 여부를 검사**하고 국제 협약 증서를 대리 발급.

---

## 2. 기자재 인증의 핵심: 형식승인 (Type Approval, TA)

파나시아(PANASIA)의 **탈황장치(PaSOx)**, **선박평형수처리장치(GloEn-Patrol)**, **탄소포집설비(PaCCUS)**와 같은 선박 친환경 기자재는 선박에 장착되기 전 반드시 선급의 **형식승인(Type Approval)**을 획득해야 합니다.

```
 [제조사 (파나시아)] ──► 설계 도면 및 육상 테스트 베드 실증 (Land-based Test)
         │
         ▼
 [선급/기국 감사]   ──► 실선 탑재 시험 (Shipboard Test, 6개월~1년 연속 운항)
         │
         ▼
 [형식승인서 발급] ──► Type Approval Certificate (전 세계 선박 납품 및 운항 가능)
```

- **시험 항목**:
  - 내구성(진동, 경사, 온도, 염분, 방폭 등 해양 극한 환경 시험)
  - 연속배출모니터링(CEMS) 계측 오차율 및 데이터 무결성
  - 규제 농도 제거 성능(D-2 미생물 사멸률, SOx 저감률)

---

## 3. 핵심 3대 국제 환경 협약 및 선급 인증 규격

### 3.1. IMO MARPOL Annex VI (선박대기오염방지협약) — 탈황장치(PaSOx)
선박 배기가스 내 황산화물(SOx) 배출 억제 및 세정수 해양 배출 규정. (근거: IMO Resolution MEPC.340(77))

| 계측 항목 | 선급 및 협약 기준치 | 정상 (Normal) | 주의/경보 (Alarm) | 위반 (Critical) |
|---|---|---|---|---|
| **배출가스 SO₂/CO₂ 비 (일반 해역)** | 황 함유량 0.50% S 상당 | $\le 18.0$ ppm | $18.0 \sim 21.7$ ppm | **$> 21.7$ ppm** (규제 초과) |
| **배출가스 SO₂/CO₂ 비 (ECA 해역)** | 황 함유량 0.10% S 상당 | $\le 3.5$ ppm | $3.5 \sim 4.3$ ppm | **$> 4.3$ ppm** (규제 초과) |
| **세정수 선외 배출 pH** | 해양 생태계 보호 | $6.8 \sim 8.5$ pH | $6.5 \sim 6.8$ pH | **$< 6.5$ pH** (산성 방류 경보)<br>*(선외 즉시 배출구: $< 4.0$ 긴급 차단)* |
| **세정수 탁도 상승폭 (Turbidity)** | 흡입수 대비 차이 | $< 15$ NTU | $15 \sim 25$ NTU | **$> 25$ NTU** (필터 역세척/점검) |
| **다환방향족탄화수소 (PAH)** | 유류/매연 세정 찌꺼기 | $< 35$ ppb | $35 \sim 50$ ppb | **$> 50$ ppb** |

### 3.2. IMO BWM Convention Regulation D-2 (선박평형수관리협약) — 평형수(GloEn-Patrol)
외래 해양 생물 침입 방지를 위한 평형수 처리 및 살균 규정.

| 계측 항목 | 선급 및 협약 기준치 | 정상 (Normal) | 주의/경보 (Alarm) | 비고 |
|---|---|---|---|---|
| **처리 유량 (Flow Rate)** | 형식승인 정격용량(TRC) | TRC의 $30 \sim 95\%$ | $95 \sim 100\%$ | **$> 100\%$** 시 과유량 인터록 경보 |
| **여과기 차압 (Filter DP)** | 자동 역세척 제어 | $0.2 \sim 0.8$ bar | $0.8 \sim 1.0$ bar | **$\ge 1.0$ bar** 자동 역세척 기동<br>**$\ge 1.5$ bar** 필터 막힘 경보 |
| **자외선(UV) 조사 강도** | 최소 살균 에너지 | $> 350 \text{ W/m}^2$ | $250 \sim 350 \text{ W/m}^2$ | **$< 250 \text{ W/m}^2$** UV 램프 수명 경보 |
| **잔류산화제 (TRO 중화)** | 전기분해/중화제 제어 | $\le 0.05$ ppm | $0.05 \sim 0.1$ ppm | **$> 0.2$ ppm** 배출 규제 위반 |

### 3.3. IACS UR E26 / E27 (선박 사이버 복원력 및 데이터 무결성)
2024년 7월부터 신조선에 전면 의무화된 선급 공통 사이버 보안 및 텔레메트리 규정.
- **요구사항**: 통신 단절 시에도 센서 데이터가 손실되지 않고 온보드 에지에 안전하게 보관되어야 함(**Store-and-Forward** 의무).
- **데이터 위변조 방지**: 센서 타임스탬프와 원시 데이터의 변경 불가(Immutability) 보장 및 전송 이력 감사 추적(Audit Trail).

---

## 4. 본 프로젝트(`marine-sensor-gis`) 코드 및 UI 매핑

| 프로젝트 모듈 | 선급 / 표준 인증 도메인 반영 내용 |
|---|---|
| `src/types/telemetry.ts` | 선급 공식 규정 주석 표기 (`// IMO MARPOL Annex VI Reg. 14`, `// IMO BWM Reg. D-2`) |
| `GaugeChart.tsx` | IMO SOx 한계치(4.3ppm / 21.7ppm) 및 세정수 pH 6.5 기준선 컬러 밴드 렌더링 |
| `RadarChart.tsx` | 5개 축(CEMS 정밀도, 필터 차압 여유, UV 램프 잔여수명, 세정수 펌프 효율, 중화제 안정도)의 선급 형식승인 기준(100%) 대비 건전성 진단 |
| `HeatmapChart.tsx` | 항만국통제(PSC) 및 선급 검사관 대상 시간대별 환경 규제 임계치 초과 발생 빈도 매트릭스 |
| `ComplianceOfficerDashboard` | 선급 공인 전자 기록부(MARPOL/BWM Electronic Record Book) 데이터 조회 및 공식 감사용 CSV 내보내기 |
| `dualDbSyncEngine.ts` | IACS UR E26/E27 사이버 복원력 준수 Store-and-Forward 오프라인 버퍼링 및 무결성 배치 동기화 |
