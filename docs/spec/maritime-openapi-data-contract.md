# 해양 공공데이터 & 위성 AIS 데이터 계약서 (Maritime OpenAPI Data Contract)

이 문서는 대한민국 공공데이터포털(`data.go.kr`)의 **해양수산부 PORT-MIS 선박제원/운항정보**와 **글로벌 위성 AISStream.io WebSocket**의 실측 명세를 우리 관제 시스템 인터페이스(`src/types/telemetry.ts`)와 1:1 바인딩한 데이터 계약(Data Contract) 정본 명세서입니다.

---

## 1. 데이터 소스 및 API 기본 정보

| 소스 구분 | 서비스명 / 엔드포인트 | 인증 방식 | 제공 항목 |
| :--- | :--- | :--- | :--- |
| **공공데이터포털 ①** | **해양수산부_선박제원정보 서비스**<br>`http://apis.data.go.kr/1192000/SicsVsslManp3/Info3` | `pass: data.go.kr/service-key`<br>(Query param: `serviceKey`) | 선박명, 호출부호, IMO번호, 선종, 국적, 총톤수(GT), 선박 길이(LOA), 너비, 깊이 |
| **공공데이터포털 ②** | **해양수산부_선박운항정보 서비스 (PORT-MIS)**<br>`http://apis.data.go.kr/1192000/VsslEtrynd5/Info5` | `pass: data.go.kr/service-key`<br>(Query param: `serviceKey`) | 항만청코드(`020`=부산항), 입출항일시, 입항목적, 출항지, 차항지, 선석명 |
| **글로벌 위성 AIS** | **AISStream.io WebSocket**<br>`wss://stream.aisstream.io/v0/stream` | `pass: aisstream.io/api-key`<br>(JSON subscription payload) | 초 단위 동적 GPS(위도, 경도), 선수각(TrueHeading), 대지속도(SOG), 대지침로(COG) |
| **선박 엣지 물리엔진** | **GCP e2-micro Marine Edge Daemon**<br>`http://34.133.74.29:8000` (FastAPI) | Local Network / Store-and-Forward | 10Hz Scrubber(SOx/CO2, pH, 탁도) & BWTS(차압, UV, TRO) IMO 규정 준수 센서 |

---

## 2. 1:1 필드 매핑 테이블 (Field Mapping Dictionary)

### 🚢 선박 마스터 및 제원 정보 매핑 (`VesselInfo`)

| 우리 도메인 필드 (`VesselInfo`) | 해양수산부 선박제원 (`Info3`) | 해양수산부 선박운항 (`Info5`) | AISStream.io (`ShipStaticData`) | 타입 / 기본값 / 변환 로직 |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `<vsslNo>` (선박번호) | `<clsgn>` | `MetaData.MMSI` | `string` (MMSI 또는 선박번호) |
| **`imoNumber`** | `<imoNo>` (IMO번호) | - | `Message.ShipStaticData.ImoNumber` | `string` (7자리 숫자, 예: `9186467`) |
| **`name`** | `<vsslKorNm>` / `<vsslEngNm>` | `<vsslNm>` | `MetaData.ShipName` | `string` (선박명) |
| **`callSign`** | `<clsgn>` (호출부호) | `<clsgn>` | `Message.ShipStaticData.CallSign` | `string` (예: `021568`) |
| **`vesselType`** | `<vsslKnd>` (선종명) | `<vsslKndNm>` | `Message.ShipStaticData.ShipType` | `string` (예: `케미칼 운반선`, `컨테이너선`) |
| **`flag`** | `<vsslNlty>` (국적코드) | `<vsslNltyCd>` | - | `string` (예: `KR`, `PA`) |
| **`grossTonnage`** | `<grtg>` (총톤수) | - | - | `number` (톤, 예: `2204`) |
| **`lengthMeters`** | `<vsslTotLt>` (전체길이) | - | `Dimension.A + Dimension.B` | `number` (미터, 예: `85`) |
| **`beamMeters`** | `<shdth>` (너비) | - | `Dimension.C + Dimension.D` | `number` (미터, 예: `14.4`) |
| **`destination`** | - | `<dstnPrtNm>` (차항지) | `Message.ShipStaticData.Destination` | `string` (예: `BUSAN`) |
| **`eta`** | - | `<etryptDt>` (입항일시) | `Message.ShipStaticData.Eta` | `ISO 8601 string` |

---

### 📍 실시간 동적 항행 매핑 (`PositionReport`)

| 우리 도메인 필드 | AISStream.io 원본 필드 | 포맷 / 범위 | 예외 처리 및 폴백 로직 |
| :--- | :--- | :--- | :--- |
| **`position.lat`** | `Message.PositionReport.Latitude` | `-90.0 ~ 90.0` | `MetaData.latitude`로 1차 폴백 |
| **`position.lng`** | `Message.PositionReport.Longitude` | `-180.0 ~ 180.0` | `MetaData.longitude`로 1차 폴백 |
| **`speedKts`** | `Message.PositionReport.Sog` | `0.0 ~ 102.2` knot | `102.3`(측정 불가)일 경우 `0.0` 처리 |
| **`headingDeg`** | `Message.PositionReport.TrueHeading` | `0 ~ 359` degree | **`511`(센서 미탑재/고장)일 경우 `Cog`(대지침로)로 자동 스냅 대체** |
| **`status`** | `Message.PositionReport.NavigationalStatus` | `0 ~ 15` | `0`: 항해 중(`NORMAL`), `1`: 닻 정박, `5`: 계류 중 |

---

## 3. 어댑터 아키텍처 및 구현 계획

```
[외부 원시 피드]
  ├── PORT-MIS XML 응답 ──► [PortMisAdapter]      ──┐
  │                                                ├──► [VesselDataAggregator] ──► Supabase / UI
  └── AISStream JSON     ──► [AisMessageAdapter]   ──┘
```

1. **`PortMisAdapter` (`src/services/portMisService.ts`)**:
   - `http://apis.data.go.kr` 호출 및 XML 파싱 (`fast-xml-parser` 또는 브라우저 `DOMParser`).
   - 부산항(`prtAgCd=020`) 기준 입출항 선박 목록을 조회하여 마스터 제원 캐싱.
2. **`AisMessageAdapter` (`src/services/aisMessageAdapter.ts`)**:
   - `PositionReport`와 `ShipStaticData`를 MMSI 키 기준으로 인메모리 결합.
   - `TrueHeading === 511` 예외 처리 및 GIS 화살표 각도 보정.
3. **단위 테스트 (TDD)**:
   - `tests/portMisAdapter.spec.ts`: 실측 XML 샘플 기반 파싱 검증.
   - `tests/aisMessageAdapter.spec.ts`: 실제 웹소켓 수신 JSON 샘플 기반 매핑 검증.
