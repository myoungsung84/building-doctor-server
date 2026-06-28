import {
  classifyVWorldApiFailure,
  classifyVWorldHttpFailure,
  classifyVWorldMalformedResponse,
  classifyVWorldRuntimeError,
  type VWorldGeocodeResult,
} from '@app/domain';

const VWORLD_ENDPOINT = 'https://api.vworld.kr/req/address';

type VWorldAddressResponse = {
  response?: {
    error?: {
      code?: string;
      text?: string;
    };
    refined?: {
      text?: string;
    };
    result?: {
      crs?: string;
      point?: {
        x?: string;
        y?: string;
      };
    };
    status?: string;
  };
};

export class VWorldGeocodingClient {
  private readonly endpoint = VWORLD_ENDPOINT;

  constructor(private readonly apiKey: string) {
    if (!apiKey?.trim()) {
      throw new Error('VWORLD_API_KEY is required');
    }
  }

  async geocodeParcelAddress(query: string): Promise<VWorldGeocodeResult> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        errorMessage: 'empty geocoding query',
        failureType: 'permanent',
        provider: 'vworld',
        query,
        rawResponse: null,
        status: 'failed',
      };
    }

    const url = new URL(this.endpoint);
    url.searchParams.set('service', 'address');
    url.searchParams.set('request', 'getCoord');
    url.searchParams.set('version', '2.0');
    url.searchParams.set('crs', 'EPSG:4326');
    url.searchParams.set('address', normalizedQuery);
    url.searchParams.set('refine', 'true');
    url.searchParams.set('simple', 'false');
    url.searchParams.set('format', 'json');
    url.searchParams.set('type', 'parcel');
    url.searchParams.set('key', this.apiKey);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return {
          errorMessage: `VWorld HTTP error: ${response.status} ${response.statusText}`,
          failureType: classifyVWorldHttpFailure(response.status, response.statusText),
          provider: 'vworld',
          query: normalizedQuery,
          rawResponse: null,
          status: 'failed',
        };
      }

      const json = (await response.json()) as VWorldAddressResponse;
      const status = json.response?.status;
      const crs = json.response?.result?.crs;
      const point = json.response?.result?.point;

      if (status !== 'OK') {
        const errorCode = json.response?.error?.code;
        const errorText = json.response?.error?.text;

        return {
          errorMessage: `VWorld status is not OK${errorCode ? ` (${errorCode})` : ''}${errorText ? `: ${errorText}` : ''}`,
          failureType: classifyVWorldApiFailure({
            errorCode,
            errorText,
            responseStatus: status,
          }),
          provider: 'vworld',
          query: normalizedQuery,
          rawResponse: json,
          status: 'failed',
        };
      }

      if (crs !== 'EPSG:4326') {
        return {
          errorMessage: `Unexpected VWorld CRS: ${crs ?? 'unknown'}`,
          failureType: classifyVWorldMalformedResponse(
            `Unexpected VWorld CRS: ${crs ?? 'unknown'}`,
          ),
          provider: 'vworld',
          query: normalizedQuery,
          rawResponse: json,
          status: 'failed',
        };
      }

      const lng = Number(point?.x);
      const lat = Number(point?.y);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
          errorMessage: 'VWorld response does not contain valid numeric point.x/point.y',
          failureType: classifyVWorldMalformedResponse(
            'VWorld response does not contain valid numeric point.x/point.y',
          ),
          provider: 'vworld',
          query: normalizedQuery,
          rawResponse: json,
          status: 'failed',
        };
      }

      return {
        lat,
        lng,
        provider: 'vworld',
        query: normalizedQuery,
        rawResponse: json,
        refinedText: json.response?.refined?.text ?? null,
        status: 'success',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown VWorld error';

      return {
        errorMessage,
        failureType: classifyVWorldRuntimeError(errorMessage),
        provider: 'vworld',
        query: normalizedQuery,
        rawResponse: null,
        status: 'failed',
      };
    }
  }
}
