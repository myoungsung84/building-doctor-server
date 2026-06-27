import { createHash } from 'node:crypto';

const SOURCE_NAME = 'molit_nrg_trade';
const XML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&apos;': "'",
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"',
};

export type MolitRawTradeItem = Record<string, string>;

export type MolitParsedResponse = {
  items: MolitRawTradeItem[];
  numOfRows: number;
  pageNo: number;
  resultCode: string | null;
  resultMsg: string | null;
  totalCount: number;
};

export type NonResidentialTradeUpsertInput = {
  buildYear: number | null;
  buildingArea: string | null;
  buildingType: string | null;
  buildingUse: string | null;
  buyerGbn: string | null;
  canceledAt: string | null;
  cdealType: string | null;
  dealAmountManwon: number;
  dealDate: string;
  dealDay: number;
  dealMonth: number;
  dealYear: number;
  dealingGbn: string | null;
  estateAgentSggNm: string | null;
  floor: number | null;
  geocodingQuery: string | null;
  geocodingStatus: 'pending' | 'skipped';
  geocodingUpdatedAt: string | null;
  isCanceled: boolean;
  isJibunMasked: boolean;
  isShareDeal: boolean;
  jibun: string | null;
  landUse: string | null;
  needsGeocoding: boolean;
  plottageArea: string | null;
  raw: MolitRawTradeItem;
  sellerGbn: string | null;
  sggCd: string;
  sggNm: string;
  shareDealingType: string | null;
  source: string;
  sourceRequestKey: string;
  sourceRequestLawdCd: string;
  sourceRequestYm: string;
  sourceRowHash: string;
  umdNm: string;
};

type NormalizeTradeItemOptions = {
  dealYmd: string;
  lawdCd: string;
  rawItem: MolitRawTradeItem;
};

function decodeXmlEntities(value: string): string {
  return value.replace(/&(amp|apos|gt|lt|quot);/g, (entity) => XML_ENTITY_MAP[entity] ?? entity);
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function extractSingleTag(xml: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(pattern);

  if (!match) {
    return null;
  }

  return decodeXmlEntities(stripCdata(match[1] ?? ''));
}

function extractItemBlocks(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1] ?? '');
}

function parseItemBlock(itemXml: string): MolitRawTradeItem {
  const rawItem: MolitRawTradeItem = {};

  for (const match of itemXml.matchAll(/<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g)) {
    const [, tagName, rawValue] = match;
    rawItem[tagName] = decodeXmlEntities(stripCdata(rawValue ?? ''));
  }

  return rawItem;
}

function normalizeString(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === '' ? null : trimmed;
}

function parseInteger(
  value: string | null,
  fieldName: string,
  options?: { required?: boolean },
): number | null {
  if (value == null) {
    if (options?.required) {
      throw new Error(`${fieldName} is required`);
    }

    return null;
  }

  const normalized = value.replaceAll(',', '');
  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return parsed;
}

function parseRequiredInteger(value: string | null, fieldName: string): number {
  const parsed = parseInteger(value, fieldName, { required: true });

  if (parsed === null) {
    throw new Error(`${fieldName} is required`);
  }

  return parsed;
}

function parseDecimal(value: string | null, fieldName: string): string | null {
  if (value == null) {
    return null;
  }

  const normalized = value.replaceAll(',', '');

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`${fieldName} must be numeric`);
  }

  return normalized;
}

function parseCancelDate(value: string | null): string | null {
  if (value == null) {
    return null;
  }

  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);

  if (!match) {
    throw new Error('cdealDay must match YY.MM.DD');
  }

  const [, year, month, day] = match;

  return `20${year}-${month}-${day}`;
}

function formatDealDate(year: number, month: number, day: number): string {
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}`;
}

function buildSourceRowHash(rawItem: MolitRawTradeItem, lawdCd: string, dealYmd: string): string {
  const normalizedItem = Object.entries(rawItem)
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce<Record<string, string | null>>((accumulator, [key, value]) => {
      accumulator[key] = normalizeString(value);
      return accumulator;
    }, {});

  const hashInput = stableStringify({
    source: SOURCE_NAME,
    sourceRequestLawdCd: lawdCd,
    sourceRequestYm: dealYmd,
    rawItem: normalizedItem,
  });

  return createHash('sha256').update(hashInput).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );

    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function parseMolitNrgTradeResponse(xml: string): MolitParsedResponse {
  const resultCode = extractSingleTag(xml, 'resultCode');
  const resultMsg = extractSingleTag(xml, 'resultMsg');
  const totalCount = Number.parseInt(extractSingleTag(xml, 'totalCount') ?? '0', 10);
  const pageNo = Number.parseInt(extractSingleTag(xml, 'pageNo') ?? '1', 10);
  const numOfRows = Number.parseInt(extractSingleTag(xml, 'numOfRows') ?? '100', 10);
  const items = extractItemBlocks(xml).map((itemXml) => parseItemBlock(itemXml));

  return {
    items,
    numOfRows: Number.isNaN(numOfRows) ? 100 : numOfRows,
    pageNo: Number.isNaN(pageNo) ? 1 : pageNo,
    resultCode,
    resultMsg,
    totalCount: Number.isNaN(totalCount) ? 0 : totalCount,
  };
}

export function normalizeMolitTradeItem(
  options: NormalizeTradeItemOptions,
): NonResidentialTradeUpsertInput {
  const rawItem = options.rawItem;
  const normalized = Object.fromEntries(
    Object.entries(rawItem).map(([key, value]) => [key, normalizeString(value)]),
  ) as Record<string, string | null>;

  const dealYear = parseRequiredInteger(normalized.dealYear, 'dealYear');
  const dealMonth = parseRequiredInteger(normalized.dealMonth, 'dealMonth');
  const dealDay = parseRequiredInteger(normalized.dealDay, 'dealDay');
  const dealAmountManwon = parseRequiredInteger(normalized.dealAmount, 'dealAmount');
  const sggCd = normalized.sggCd ?? options.lawdCd;
  const sggNm = normalized.sggNm;
  const umdNm = normalized.umdNm;

  if (!sggNm || !umdNm) {
    throw new Error('sggNm and umdNm are required');
  }

  const jibun = normalized.jibun;
  const isJibunMasked = jibun?.includes('*') ?? false;
  const canceledAt = parseCancelDate(normalized.cdealDay);
  const cdealType = normalized.cdealType;
  const shareDealingType = normalized.shareDealingType;
  const isCanceled = cdealType === 'O' || canceledAt !== null;
  const isShareDeal = shareDealingType === '지분';
  const geocodingQuery = !isJibunMasked && jibun ? `서울특별시 ${sggNm} ${umdNm} ${jibun}` : null;
  const geocodingStatus = isJibunMasked ? 'skipped' : 'pending';
  const geocodingUpdatedAt = isJibunMasked ? new Date().toISOString() : null;

  return {
    buildYear: parseInteger(normalized.buildYear, 'buildYear'),
    buildingArea: parseDecimal(normalized.buildingAr, 'buildingAr'),
    buildingType: normalized.buildingType,
    buildingUse: normalized.buildingUse,
    buyerGbn: normalized.buyerGbn,
    canceledAt,
    cdealType,
    dealAmountManwon,
    dealDate: formatDealDate(dealYear, dealMonth, dealDay),
    dealDay,
    dealMonth,
    dealYear,
    dealingGbn: normalized.dealingGbn,
    estateAgentSggNm: normalized.estateAgentSggNm,
    floor: parseInteger(normalized.floor, 'floor'),
    geocodingQuery,
    geocodingStatus,
    geocodingUpdatedAt,
    isCanceled,
    isJibunMasked,
    isShareDeal,
    jibun,
    landUse: normalized.landUse,
    needsGeocoding: !isJibunMasked,
    plottageArea: parseDecimal(normalized.plottageAr, 'plottageAr'),
    raw: rawItem,
    sellerGbn: normalized.slerGbn,
    sggCd,
    sggNm,
    shareDealingType,
    source: SOURCE_NAME,
    sourceRequestKey: `${SOURCE_NAME}:${options.lawdCd}:${options.dealYmd}`,
    sourceRequestLawdCd: options.lawdCd,
    sourceRequestYm: options.dealYmd,
    sourceRowHash: buildSourceRowHash(rawItem, options.lawdCd, options.dealYmd),
    umdNm,
  };
}
