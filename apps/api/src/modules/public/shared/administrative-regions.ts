const SIDO_CODE_TO_NAME: Record<string, string> = {
  '11': '서울특별시',
  '26': '부산광역시',
  '27': '대구광역시',
  '28': '인천광역시',
  '29': '광주광역시',
  '30': '대전광역시',
  '31': '울산광역시',
  '36': '세종특별자치시',
  '41': '경기도',
  '42': '강원특별자치도',
  '43': '충청북도',
  '44': '충청남도',
  '45': '전북특별자치도',
  '46': '전라남도',
  '47': '경상북도',
  '48': '경상남도',
  '50': '제주특별자치도',
};

const SIDO_NAME_TO_CODE: Record<string, string> = {
  서울: '11',
  서울시: '11',
  서울특별시: '11',
  부산: '26',
  부산시: '26',
  부산광역시: '26',
  대구: '27',
  대구시: '27',
  대구광역시: '27',
  인천: '28',
  인천시: '28',
  인천광역시: '28',
  광주: '29',
  광주시: '29',
  광주광역시: '29',
  대전: '30',
  대전시: '30',
  대전광역시: '30',
  울산: '31',
  울산시: '31',
  울산광역시: '31',
  세종: '36',
  세종시: '36',
  세종특별자치시: '36',
  경기: '41',
  경기도: '41',
  강원: '42',
  강원도: '42',
  강원특별자치도: '42',
  충북: '43',
  충청북도: '43',
  충남: '44',
  충청남도: '44',
  전북: '45',
  전라북도: '45',
  전북특별자치도: '45',
  전남: '46',
  전라남도: '46',
  경북: '47',
  경상북도: '47',
  경남: '48',
  경상남도: '48',
  제주: '50',
  제주도: '50',
  제주특별자치도: '50',
};

export type SidoInfo = {
  sidoCd: string | null;
  sidoNm: string | null;
};

function normalizeSidoName(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export function extractSidoCdFromSggCd(sggCd: string | null | undefined): string | null {
  if (!sggCd) {
    return null;
  }

  const digitsOnly = sggCd.replace(/\D/g, '');

  if (digitsOnly.length < 2) {
    return null;
  }

  return digitsOnly.slice(0, 2);
}

export function resolveSidoNameByCode(sidoCd: string | null | undefined): string | null {
  if (!sidoCd) {
    return null;
  }

  return SIDO_CODE_TO_NAME[sidoCd] ?? null;
}

export function resolveSidoCodeByName(sidoNm: string | null | undefined): string | null {
  if (!sidoNm) {
    return null;
  }

  return SIDO_NAME_TO_CODE[normalizeSidoName(sidoNm)] ?? null;
}

export function resolveSidoInfoFromSggCd(sggCd: string | null | undefined): SidoInfo {
  const sidoCd = extractSidoCdFromSggCd(sggCd);

  return {
    sidoCd,
    sidoNm: resolveSidoNameByCode(sidoCd),
  };
}
