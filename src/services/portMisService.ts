import { XMLParser } from 'fast-xml-parser';

export interface PortMisVesselSpec {
  vsslNo: string;
  callSign: string;
  imoNumber: string;
  name: string;
  vesselType: string;
  flag: string;
  grossTonnage: number;
  netTonnage?: number;
  lengthMeters: number;
  beamMeters: number;
  depthMeters?: number;
  buildDate?: string;
}

export interface PortMisVoyageRecord {
  portCode: string;
  portName: string;
  callSign: string;
  vesselName: string;
  vesselType: string;
  purpose: string;
  originPort: string;
  entryDate?: string;
  facilityName?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false, // 문자열 보존
});

/**
 * 선박종류/국적 등의 코드 텍스트(예: "52[석유제품 운반선]", "KR[대한민국]") 정제
 */
function cleanBrackets(text?: string): string {
  if (!text) return '';
  const match = text.match(/\[(.*?)\]/);
  return match ? match[1] : text;
}

function cleanFlagCode(text?: string): string {
  if (!text) return '';
  const match = text.match(/^([A-Za-z0-9]+)/);
  return match ? match[1] : text;
}

/**
 * 해양수산부_선박제원정보 (SicsVsslManp3/Info3) XML 응답 파서
 */
export function parseVesselSpecsXml(xml: string): PortMisVesselSpec[] {
  try {
    const parsed = parser.parse(xml);
    const header = parsed?.response?.header;
    if (header?.resultCode !== '00' && header?.resultCode !== 0) {
      return [];
    }

    const rawItems = parsed?.response?.body?.items?.item;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map((item: any) => {
      // 영문명이 있으면 영문명 우선, 없으면 한글명 사용
      const name = item.vsslEngNm || item.vsslKorNm || '';
      return {
        vsslNo: String(item.vsslNo || ''),
        callSign: String(item.clsgn || ''),
        imoNumber: String(item.imoNo || ''),
        name,
        vesselType: cleanBrackets(item.vsslKnd),
        flag: cleanFlagCode(item.vsslNlty),
        grossTonnage: Number(item.grtg || item.intrlGrtg || 0),
        netTonnage: item.ntng ? Number(item.ntng) : undefined,
        lengthMeters: Number(item.vsslTotLt || item.vsslLt || 0),
        beamMeters: Number(item.shdth || 0),
        depthMeters: item.vsslDp ? Number(item.vsslDp) : undefined,
        buildDate: item.vsslCnstrDt,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 해양수산부_선박운항정보 (VsslEtrynd5/Info5) XML 응답 파서
 */
export function parseVesselVoyageXml(xml: string): PortMisVoyageRecord[] {
  try {
    const parsed = parser.parse(xml);
    const header = parsed?.response?.header;
    if (header?.resultCode !== '00' && header?.resultCode !== 0) {
      return [];
    }

    const rawItems = parsed?.response?.body?.items?.item;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map((item: any) => {
      const detail = item.details?.detail;
      const firstDetail = Array.isArray(detail) ? detail[0] : detail;

      return {
        portCode: String(item.prtAgCd || ''),
        portName: String(item.prtAgNm || ''),
        callSign: String(item.clsgn || ''),
        vesselName: String(item.vsslNm || ''),
        vesselType: String(item.vsslKndNm || ''),
        purpose: String(item.etryptPurpsNm || ''),
        originPort: String(item.frstDpmprtPrtNm || ''),
        entryDate: firstDetail?.entryDate || firstDetail?.etryptDt,
        facilityName: firstDetail?.laidupFcltyNm,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 실시간 선박제원정보 호출 헬퍼
 */
export async function fetchVesselSpecs(
  serviceKey: string,
  query: { vsslNm?: string; clsgn?: string; pageNo?: number; numOfRows?: number } = {}
): Promise<PortMisVesselSpec[]> {
  const url = new URL('https://apis.data.go.kr/1192000/SicsVsslManp3/Info3');
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('pageNo', String(query.pageNo || 1));
  url.searchParams.set('numOfRows', String(query.numOfRows || 10));
  if (query.vsslNm) url.searchParams.set('vsslNm', query.vsslNm);
  if (query.clsgn) url.searchParams.set('clsgn', query.clsgn);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`PORT-MIS API HTTP Error: ${res.status}`);
  const xml = await res.text();
  return parseVesselSpecsXml(xml);
}
