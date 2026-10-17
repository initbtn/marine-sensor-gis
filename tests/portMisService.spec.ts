import { describe, it, expect } from 'vitest';
import { parseVesselSpecsXml, parseVesselVoyageXml } from '../src/services/portMisService';

// 실측 해양수산부 선박제원 XML 샘플 (docs/api/DAT211_오픈API활용가이드_선박제원.pdf 실측)
const SAMPLE_SPECS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <ibobprt>2[내항]</ibobprt>
        <clsgn>021568</clsgn>
        <vsslNo>021568</vsslNo>
        <imoNo>9186467</imoNo>
        <vsslKorNm>101효동케미호</vsslKorNm>
        <vsslEngNm>101 HYODONG CHEMI</vsslEngNm>
        <vsslKnd>52[석유제품 운반선]</vsslKnd>
        <vsslNlty>KR[대한민국]</vsslNlty>
        <grtg>2204</grtg>
        <ntng>977</ntng>
        <vsslTotLt>85</vsslTotLt>
        <shdth>14.4</shdth>
        <vsslDp>6.9</vsslDp>
        <vsslCnstrDt>1998-02-19T00:00:00+09:00</vsslCnstrDt>
      </item>
      <item>
        <ibobprt>1[외항]</ibobprt>
        <clsgn>3EKR5</clsgn>
        <vsslNo>SA1190</vsslNo>
        <imoNo>9876543</imoNo>
        <vsslKorNm>파나시아 페닉스</vsslKorNm>
        <vsslEngNm>PANASIA PHOENIX</vsslEngNm>
        <vsslKnd>53[케미칼 운반선]</vsslKnd>
        <vsslNlty>PA[파나마]</vsslNlty>
        <grtg>4151</grtg>
        <vsslTotLt>98.07</vsslTotLt>
        <shdth>17.2</shdth>
        <vsslDp>9.2</vsslDp>
      </item>
    </items>
    <numOfRows>2</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>37</totalCount>
  </body>
</response>`;

// 실측 해양수산부 선박운항정보(부산항) XML 샘플 (docs/api/DAT211_오픈API활용가이드_선박운항정보.pdf 실측)
const SAMPLE_VOYAGE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <prtAgCd>020</prtAgCd>
        <prtAgNm>부산</prtAgNm>
        <etryptYear>2026</etryptYear>
        <clsgn>244807</clsgn>
        <vsslNm>블루오션</vsslNm>
        <vsslNltyNm>대한민국</vsslNltyNm>
        <vsslKndNm>석유제품 운반선</vsslKndNm>
        <etryptPurpsNm>양하</etryptPurpsNm>
        <frstDpmprtPrtNm>울산</frstDpmprtPrtNm>
        <details>
          <detail>
            <entryDate>2026-10-15T00:00:00+09:00</entryDate>
            <laidupFcltyNm>5물량장 1선석</laidupFcltyNm>
          </detail>
        </details>
      </item>
    </items>
  </body>
</response>`;

describe('PORT-MIS 공공데이터 선박 XML 파서 (portMisService)', () => {
  it('선박제원정보 XML을 정상 파싱하여 표준 규격 객체 배열로 변환해야 한다', () => {
    const vessels = parseVesselSpecsXml(SAMPLE_SPECS_XML);

    expect(vessels).toHaveLength(2);

    const v1 = vessels[0];
    expect(v1.imoNumber).toBe('9186467');
    expect(v1.name).toBe('101 HYODONG CHEMI');
    expect(v1.callSign).toBe('021568');
    expect(v1.vesselType).toBe('석유제품 운반선');
    expect(v1.flag).toBe('KR');
    expect(v1.grossTonnage).toBe(2204);
    expect(v1.lengthMeters).toBe(85);
    expect(v1.beamMeters).toBe(14.4);

    const v2 = vessels[1];
    expect(v2.imoNumber).toBe('9876543');
    expect(v2.name).toBe('PANASIA PHOENIX');
    expect(v2.flag).toBe('PA');
    expect(v2.grossTonnage).toBe(4151);
  });

  it('선박운항정보(부산항 입출항) XML을 정상 파싱해야 한다', () => {
    const voyages = parseVesselVoyageXml(SAMPLE_VOYAGE_XML);

    expect(voyages).toHaveLength(1);
    expect(voyages[0].portName).toBe('부산');
    expect(voyages[0].vesselName).toBe('블루오션');
    expect(voyages[0].callSign).toBe('244807');
    expect(voyages[0].purpose).toBe('양하');
    expect(voyages[0].originPort).toBe('울산');
  });

  it('비정상적이거나 에러 응답 XML인 경우 빈 배열을 반환해야 한다', () => {
    const errorXml = `<response><header><resultCode>99</resultCode><resultMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</resultMsg></header></response>`;
    expect(parseVesselSpecsXml(errorXml)).toEqual([]);
    expect(parseVesselVoyageXml(errorXml)).toEqual([]);
  });
});
