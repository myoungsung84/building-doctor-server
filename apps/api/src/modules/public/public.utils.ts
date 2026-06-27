export function buildMarkerKey(sggCd: string, umdNm: string, jibun: string): string {
  return `${sggCd}:${umdNm}:${jibun}`;
}

export function calculateBuildingAreaPyeong(buildingAreaSqm: number | null): number | null {
  if (buildingAreaSqm === null || buildingAreaSqm <= 0) {
    return null;
  }

  return roundTo(buildingAreaSqm / 3.305785, 2);
}

export function calculatePricePerPyeongManwon(
  dealAmountManwon: number,
  buildingAreaSqm: number | null,
): number | null {
  const buildingAreaPyeong = calculateBuildingAreaPyeong(buildingAreaSqm);

  if (buildingAreaPyeong === null || buildingAreaPyeong <= 0) {
    return null;
  }

  return roundTo(dealAmountManwon / buildingAreaPyeong, 2);
}

export function endOfYearMonth(value: string): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));

  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export function normalizeGeocodingQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

export function roundTo(value: number, digits: number): number {
  const scale = 10 ** digits;

  return Math.round(value * scale) / scale;
}

export function startOfYearMonth(value: string): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));

  return new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
}
