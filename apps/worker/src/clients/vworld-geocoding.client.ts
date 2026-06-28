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
    status?: string;
    result?: {
      crs?: string;
      point?: {
        x?: string;
        y?: string;
      };
    };
    refined?: {
      text?: string;
    };
    error?: {
      code?: string;
      text?: string;
    };
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
        failureType: 'permanent',
        status: 'failed',
        provider: 'vworld',
        query,
        errorMessage: 'empty geocoding query',
        rawResponse: null,
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
          failureType: classifyVWorldHttpFailure(response.status, response.statusText),
          status: 'failed',
          provider: 'vworld',
          query: normalizedQuery,
          errorMessage: `VWorld HTTP error: ${response.status} ${response.statusText}`,
          rawResponse: null,
        };
      }

      const json = (await response.json()) as VWorldAddressResponse;
      const status = json.response?.status;
      const point = json.response?.result?.point;
      const crs = json.response?.result?.crs;

      if (status !== 'OK') {
        const errorText = json.response?.error?.text;
        const errorCode = json.response?.error?.code;

        return {
          failureType: classifyVWorldApiFailure({
            errorCode,
            errorText,
            responseStatus: status,
          }),
          status: 'failed',
          provider: 'vworld',
          query: normalizedQuery,
          errorMessage: `VWorld status is not OK${errorCode ? ` (${errorCode})` : ''}${errorText ? `: ${errorText}` : ''}`,
          rawResponse: json,
        };
      }

      if (crs !== 'EPSG:4326') {
        return {
          failureType: classifyVWorldMalformedResponse(
            `Unexpected VWorld CRS: ${crs ?? 'unknown'}`,
          ),
          status: 'failed',
          provider: 'vworld',
          query: normalizedQuery,
          errorMessage: `Unexpected VWorld CRS: ${crs ?? 'unknown'}`,
          rawResponse: json,
        };
      }

      const lng = Number(point?.x);
      const lat = Number(point?.y);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
          failureType: classifyVWorldMalformedResponse(
            'VWorld response does not contain valid numeric point.x/point.y',
          ),
          status: 'failed',
          provider: 'vworld',
          query: normalizedQuery,
          errorMessage: 'VWorld response does not contain valid numeric point.x/point.y',
          rawResponse: json,
        };
      }

      return {
        status: 'success',
        provider: 'vworld',
        query: normalizedQuery,
        refinedText: json.response?.refined?.text ?? null,
        lat,
        lng,
        rawResponse: json,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown VWorld error';

      return {
        failureType: classifyVWorldRuntimeError(errorMessage),
        status: 'failed',
        provider: 'vworld',
        query: normalizedQuery,
        errorMessage,
        rawResponse: null,
      };
    }
  }
}
