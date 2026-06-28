import { Injectable } from '@nestjs/common';

import { ApiException } from '@app/api';
import { AppConfigService } from '@app/config';
import { GeocodeRepository } from './geocode.repository';
import { normalizeGeocodingQuery } from '../shared/public.utils';
import { VWorldGeocodingClient } from './vworld-geocoding.client';

function extractRefinedText(rawResponse: unknown): string | null {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return null;
  }

  const response = (rawResponse as { response?: { refined?: { text?: string } } }).response;

  return response?.refined?.text ?? null;
}

@Injectable()
export class GeocodeService {
  private readonly vworldClient: VWorldGeocodingClient;

  constructor(
    private readonly configService: AppConfigService,
    private readonly geocodeRepository: GeocodeRepository,
  ) {
    this.vworldClient = new VWorldGeocodingClient(this.configService.vworldApiKey);
  }

  async geocodeAddress(query: string) {
    const normalizedQuery = normalizeGeocodingQuery(query);
    const cached = await this.geocodeRepository.findCacheByNormalizedQuery(normalizedQuery);

    if (cached) {
      await this.geocodeRepository.touchLastUsedAt(normalizedQuery);

      if (cached.status === 'success' && cached.lat !== null && cached.lng !== null) {
        return {
          lat: cached.lat,
          lng: cached.lng,
          normalizedQuery,
          provider: cached.provider,
          query,
          refinedText: extractRefinedText(cached.rawResponse),
        };
      }

      throw ApiException.notFound('주소를 찾을 수 없습니다.', [
        {
          field: 'q',
          reason: cached.errorMessage ?? 'VWorld 주소 좌표 변환 결과가 없습니다.',
        },
      ]);
    }

    const result = await this.vworldClient.geocodeParcelAddress(query);

    if (result.status === 'success') {
      await this.geocodeRepository.upsertSuccess({
        lat: result.lat,
        lng: result.lng,
        normalizedQuery,
        provider: result.provider,
        query,
        rawResponse: result.rawResponse,
      });

      return {
        lat: result.lat,
        lng: result.lng,
        normalizedQuery,
        provider: result.provider,
        query,
        refinedText: result.refinedText,
      };
    }

    if (result.failureType === 'permanent') {
      await this.geocodeRepository.upsertFailure({
        errorMessage: result.errorMessage,
        normalizedQuery,
        provider: result.provider,
        query,
        rawResponse: result.rawResponse,
      });

      throw ApiException.notFound('주소를 찾을 수 없습니다.', [
        {
          field: 'q',
          reason: result.errorMessage || 'VWorld 주소 좌표 변환 결과가 없습니다.',
        },
      ]);
    }

    throw ApiException.internal(
      '지오코딩 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.',
    );
  }
}
