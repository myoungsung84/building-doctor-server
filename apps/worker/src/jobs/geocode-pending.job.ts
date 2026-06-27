import { AppLoggerService } from '@app/logger';
import { normalizeGeocodingQuery } from '../lib/geocoding-query';
import { NonResidentialTradesRepository } from '../repositories/non-residential-trades.repository';
import { VWorldGeocodingClient } from '../clients/vworld-geocoding.client';

export type GeocodePendingOptions = {
  limit: number;
};

export type GeocodePendingJobSummary = {
  apiFailure: number;
  apiSuccess: number;
  cacheFailureHit: number;
  cacheSuccessHit: number;
  pendingFound: number;
  skipped: number;
};

export class GeocodePendingJob {
  constructor(
    private readonly repository: NonResidentialTradesRepository,
    private readonly logger: AppLoggerService,
    private readonly vworldClient: VWorldGeocodingClient,
  ) {}

  async run(options: GeocodePendingOptions): Promise<GeocodePendingJobSummary> {
    const context = 'GeocodePendingJob';
    const trades = await this.repository.findPendingGeocodingTrades(options.limit);
    const summary: GeocodePendingJobSummary = {
      apiFailure: 0,
      apiSuccess: 0,
      cacheFailureHit: 0,
      cacheSuccessHit: 0,
      pendingFound: trades.length,
      skipped: 0,
    };

    if (trades.length === 0) {
      this.logger.log('no pending geocoding trades found', context);
      return summary;
    }

    this.logger.log(`pending geocoding trades found: ${trades.length}`, context);

    for (const trade of trades) {
      try {
        const normalizedQuery = normalizeGeocodingQuery(trade.geocodingQuery);
        const cache = await this.repository.findGeocodingCacheByNormalizedQuery(normalizedQuery);

        if (cache) {
          await this.repository.touchGeocodingCacheLastUsedAt(normalizedQuery);

          if (cache.status === 'success' && cache.lat !== null && cache.lng !== null) {
            await this.repository.markTradeGeocodingSuccess(
              trade.id,
              cache.provider,
              cache.lat,
              cache.lng,
            );
            summary.cacheSuccessHit += 1;
            continue;
          }

          await this.repository.markTradeGeocodingFailure(
            trade.id,
            cache.provider,
            cache.errorMessage ?? 'cached geocoding failure',
          );
          summary.cacheFailureHit += 1;
          continue;
        }

        const result = await this.vworldClient.geocodeParcelAddress(trade.geocodingQuery);

        if (result.status === 'success') {
          await this.repository.upsertGeocodingCacheSuccess({
            lat: result.lat,
            lng: result.lng,
            normalizedQuery,
            provider: result.provider,
            query: trade.geocodingQuery,
            rawResponse: result.rawResponse,
          });
          await this.repository.markTradeGeocodingSuccess(
            trade.id,
            result.provider,
            result.lat,
            result.lng,
          );
          summary.apiSuccess += 1;
          continue;
        }

        await this.repository.upsertGeocodingCacheFailure({
          errorMessage: result.errorMessage,
          normalizedQuery,
          provider: result.provider,
          query: trade.geocodingQuery,
          rawResponse: result.rawResponse,
        });
        await this.repository.markTradeGeocodingFailure(
          trade.id,
          result.provider,
          result.errorMessage,
        );
        summary.apiFailure += 1;
      } catch (error) {
        summary.skipped += 1;
        const trace = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `failed to process geocoding trade id=${trade.id}, query=${trade.geocodingQuery}`,
          trace,
          context,
        );
      }
    }

    this.logger.log(
      `geocoding done: pending=${summary.pendingFound}, cacheSuccessHit=${summary.cacheSuccessHit}, cacheFailureHit=${summary.cacheFailureHit}, apiSuccess=${summary.apiSuccess}, apiFailure=${summary.apiFailure}, skipped=${summary.skipped}`,
      context,
    );

    return summary;
  }
}
