const YYYYMM_PATTERN = /^\d{6}$/;

export function isValidDealYmd(value: string): boolean {
  if (!YYYYMM_PATTERN.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));

  return Number.isInteger(year) && month >= 1 && month <= 12;
}

export function compareDealYmd(left: string, right: string): number {
  return left.localeCompare(right);
}

export function expandDealYmdRange(from: string, to: string): string[] {
  if (!isValidDealYmd(from) || !isValidDealYmd(to)) {
    throw new Error('from/to must be valid YYYYMM values');
  }

  if (compareDealYmd(from, to) > 0) {
    throw new Error('from must be less than or equal to to');
  }

  const values: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(4, 6));
  const endYear = Number(to.slice(0, 4));
  const endMonth = Number(to.slice(4, 6));

  while (year < endYear || (year === endYear && month <= endMonth)) {
    values.push(`${year}${String(month).padStart(2, '0')}`);
    month += 1;

    if (month === 13) {
      year += 1;
      month = 1;
    }
  }

  return values;
}
