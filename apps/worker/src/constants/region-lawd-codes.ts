export type RegionLawdCode = {
  lawdCd: string;
  name: string;
};

export const REGION_LAWD_CODES = {
  seoul: [
    { lawdCd: '11110', name: '종로구' },
    { lawdCd: '11140', name: '중구' },
    { lawdCd: '11170', name: '용산구' },
    { lawdCd: '11200', name: '성동구' },
    { lawdCd: '11215', name: '광진구' },
    { lawdCd: '11230', name: '동대문구' },
    { lawdCd: '11260', name: '중랑구' },
    { lawdCd: '11290', name: '성북구' },
    { lawdCd: '11305', name: '강북구' },
    { lawdCd: '11320', name: '도봉구' },
    { lawdCd: '11350', name: '노원구' },
    { lawdCd: '11380', name: '은평구' },
    { lawdCd: '11410', name: '서대문구' },
    { lawdCd: '11440', name: '마포구' },
    { lawdCd: '11470', name: '양천구' },
    { lawdCd: '11500', name: '강서구' },
    { lawdCd: '11530', name: '구로구' },
    { lawdCd: '11545', name: '금천구' },
    { lawdCd: '11560', name: '영등포구' },
    { lawdCd: '11590', name: '동작구' },
    { lawdCd: '11620', name: '관악구' },
    { lawdCd: '11650', name: '서초구' },
    { lawdCd: '11680', name: '강남구' },
    { lawdCd: '11710', name: '송파구' },
    { lawdCd: '11740', name: '강동구' },
  ],
} as const satisfies Record<string, readonly RegionLawdCode[]>;

export const REGION_ADDRESS_PREFIXES = {
  seoul: '서울특별시',
} as const satisfies Record<keyof typeof REGION_LAWD_CODES, string>;

export type SupportedRegion = keyof typeof REGION_LAWD_CODES;
