const TRANSIENT_ERROR_PATTERNS = [
  /\b429\b/i,
  /\b408\b/i,
  /\b5\d{2}\b/i,
  /bad gateway/i,
  /gateway timeout/i,
  /service unavailable/i,
  /too many requests/i,
  /rate limit/i,
  /fetch failed/i,
  /timeout/i,
  /network error/i,
  /\bECONNRESET\b/i,
  /\bETIMEDOUT\b/i,
  /\bENOTFOUND\b/i,
  /\bEAI_AGAIN\b/i,
];

const PERMANENT_NO_RESULT_PATTERNS = [
  /\bNOT_FOUND\b/i,
  /\bNO_RESULT\b/i,
  /\bNO_MATCH\b/i,
  /result not found/i,
  /address not found/i,
  /no result/i,
  /no results/i,
  /not found/i,
  /검색 결과가 없습니다/i,
  /검색결과가 없습니다/i,
  /결과가 없습니다/i,
  /주소를 찾을 수 없습니다/i,
  /존재하지 않는 주소/i,
];

export type VWorldGeocodeSuccess = {
  lat: number;
  lng: number;
  provider: 'vworld';
  query: string;
  rawResponse: unknown;
  refinedText: string | null;
  status: 'success';
};

export type VWorldGeocodeFailureType = 'permanent' | 'transient';

export type VWorldGeocodeFailure = {
  errorMessage: string;
  failureType: VWorldGeocodeFailureType;
  provider: 'vworld';
  query: string;
  rawResponse: unknown;
  status: 'failed';
};

export type VWorldGeocodeResult = VWorldGeocodeFailure | VWorldGeocodeSuccess;

type VWorldApiFailureInput = {
  errorCode?: string | null;
  errorText?: string | null;
  responseStatus?: string | null;
};

function matchesPattern(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function joinFailureParts(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(' ');
}

export function classifyVWorldHttpFailure(
  status: number,
  statusText: string,
): VWorldGeocodeFailureType {
  if (status === 401 || status === 403 || status === 408 || status === 429 || status >= 500) {
    return 'transient';
  }

  if (matchesPattern(TRANSIENT_ERROR_PATTERNS, statusText)) {
    return 'transient';
  }

  return 'permanent';
}

export function classifyVWorldApiFailure(input: VWorldApiFailureInput): VWorldGeocodeFailureType {
  const combined = joinFailureParts([input.responseStatus, input.errorCode, input.errorText]);

  if (matchesPattern(TRANSIENT_ERROR_PATTERNS, combined)) {
    return 'transient';
  }

  if (matchesPattern(PERMANENT_NO_RESULT_PATTERNS, combined)) {
    return 'permanent';
  }

  return 'permanent';
}

export function classifyVWorldMalformedResponse(message: string): VWorldGeocodeFailureType {
  if (matchesPattern(PERMANENT_NO_RESULT_PATTERNS, message)) {
    return 'permanent';
  }

  return 'transient';
}

export function classifyVWorldRuntimeError(message: string): VWorldGeocodeFailureType {
  if (matchesPattern(PERMANENT_NO_RESULT_PATTERNS, message)) {
    return 'permanent';
  }

  if (matchesPattern(TRANSIENT_ERROR_PATTERNS, message)) {
    return 'transient';
  }

  return 'transient';
}
