# 파이썬 데이터 시각화 트렌드 및 해양 관제 시스템 연계 레퍼런스

이 문서는 파이썬 데이터 시각화 생태계의 과거(3년 전)와 최신 모던 트렌드 비교, 그리고 **파나시아(PANASIA) 친환경 설비(PaSOx Scrubber / GloEn-Patrol BWTS) 및 해양 센서 GIS 관제 플랫폼**과의 아키텍처 연계 방안을 정리한 기술 레퍼런스 문서입니다.

---

## 1. 파이썬 데이터 시각화 생태계 진화 (3년 전 vs 현재)

| 구분 | 3년 전 주류 (Matplotlib, Seaborn) | 현재 모던 트렌드 (2024~2026) | 대표 라이브러리 |
| :--- | :--- | :--- | :--- |
| **인터랙션** | 정적 이미지 (PNG, PDF, SVG), 줌/툴팁 불가 | 브라우저 기반 동적 조작 (줌, 팬, 호버 툴팁, 슬라이더) | **Plotly Express**, **Altair** |
| **문법 철학** | 절차형 객체 지향 (`ax.plot`, `plt.subplots`) | 그래픽스 문법(Grammar of Graphics), 선언형 JSON | **Altair** (Vega-Lite 기반) |
| **대시보드 구축** | Flask/Django + HTML/JS를 직접 작성해야 함 | 순수 파이썬 코드 몇 줄로 반응형 웹 대시보드 완성 | **Streamlit**, **Gradio**, **Solara** |
| **빅데이터/시계열**| 10만 행 이상 시 렌더링 지연 및 메모리 병목 | 수천만~수억 개 센서 로그/AIS 궤적 래스터화 렌더링 | **Datashader**, **Bokeh**, **HoloViews** |
| **해양/GIS 시각화** | Cartopy, Basemap (정적 투영 지도) | GPU 가속 3D 지도, GeoArrow 기반 초고속 렌더링 | **PyDeck** (deck.gl), **Lonboard**, **Leafmap** |
| **데이터 엔진** | Pandas 단일 스레드 인메모리 | 멀티스레드 Polars, 인메모리 OLAP DuckDB | **Polars**, **DuckDB** |

---

## 2. 4대 주요 영역별 최신 라이브러리 상세

### ① 선언형 & 인터랙티브 탐색: Plotly Express & Altair
- **Plotly Express (`px`)**:
  - 현대 파이썬 EDA의 표준 도구.
  - 단 한 줄의 함수 호출로 줌, 팬, 호버 툴팁, 범례 토글이 기본 내장된 HTML 차트 렌더링.
  - CEMS 24시간 배출가스 농도, 세정수 pH 트렌드 분석에 최적.
- **Altair**:
  - Vega-Lite 사양을 따르는 엄밀한 그래픽스 문법 라이브러리.
  - 데이터프레임의 컬럼을 시각적 채널(x, y, color, shape, size)에 선언적으로 매핑하여 통계적 다차원 관계 분석에 탁월.

### ② 파이썬 웹 대시보드 혁명: Streamlit & Gradio
- **Streamlit**:
  - 프론트엔드 빌드 과정 없이 파이썬 스크립트만으로 연구원/엔지니어용 인터랙티브 웹 대시보드 구축.
  - 이상 감지 알고리즘 파라미터 튜닝, 설비 고장 시뮬레이터 POC 개발 시 빠른 피드백 루프 제공.
- **Gradio**:
  - ML 모델 추론 결과를 웹 UI로 즉시 데모할 수 있는 표준 도구.

### ③ 대용량 센서 & 해양 GIS 시각화: PyDeck, Lonboard, Datashader
- **PyDeck**:
  - Uber의 WebGL 기반 대용량 공간 시각화 엔진인 `deck.gl`의 파이썬 래퍼.
  - 수천 척 선박의 GPS 항적 궤적(`PathLayer`), 위반 밀도 히트맵(`HeatmapLayer`), 3D 선박 모델 렌더링 지원.
- **Lonboard**:
  - GeoArrow / GeoParquet 규격을 적용하여 수백만 건의 해양 지리 좌표를 밀리초 단위로 주피터 노트북에 렌더링.
- **Datashader**:
  - 1초 단위로 수집되는 고주파 센서 시계열(100Hz 이상 진동/유량 데이터)을 서버에서 픽셀 단위로 직접 합성하여 브라우저 부하 0 달성.

---

## 3. 해양 센서 GIS 관제 플랫폼과의 아키텍처 연계

우리 프로젝트(`marine-sensor-gis`)에서 파이썬 생태계와 웹 프로덕션 프론트엔드는 아래와 같은 역할 분담 구조로 결합됩니다:

```
[선박 센서 / AIS 스트림] 
         │
         ▼
[파이썬 데이터 파이프라인 (Polars / DuckDB)]
  ├── IMO 배출가스 규제 위반 탐지
  ├── PaSOx / GloEn-Patrol 이상 징후 ML 예측 모델
  └── 내부 연구원용 빠른 검증 도구: Streamlit + Plotly / PyDeck
         │
         ▼ (REST API / WebSocket / GeoJSON 스트림)
[웹 프로덕션 프론트엔드 (React + TypeScript)]
  ├── 파나시아 ES연구팀 표준 스택 (React / Vue / Angular 생태계)
  ├── 고성능 해양 HMI: Apache ECharts + Leaflet (장식용 애니메이션 배제)
  └── 선장, 기관사, 선단 운항사, 선급 검사관 멀티 롤 대시보드
```

---

## 4. 파나시아 HMI 인터랙션 가이드 연계 (애니메이션 배제 철학)

- **산업용 표준(ISA-101 / IEC 62288)**에 따라 상시 회전 팬이나 흐르는 액체 펄스 같은 **장식용 애니메이션은 배제**합니다.
- 동적 점멸(Blinking)은 오직 **ISA-18.2 미확인 비상 경보(Unacknowledged Critical Alarm)**에만 독점 적용됩니다.
- 연구 분석 단계(Python/Streamlit)에서 유효성이 검증된 파라미터와 차트 모델은 웹 프로덕션(React + ECharts)의 정적 고대비 선급 표준 인터페이스로 전환되어 탑재됩니다.
