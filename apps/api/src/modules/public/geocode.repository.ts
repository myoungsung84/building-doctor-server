import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

import { PG_POOL } from '@app/db';

type GeocodingCacheRow = {
  errorMessage: string | null;
  lat: string | null;
  lng: string | null;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
  status: 'failed' | 'success';
};

export type GeocodingCacheRecord = {
  errorMessage: string | null;
  lat: number | null;
  lng: number | null;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
  status: 'failed' | 'success';
};

type UpsertGeocodingCacheFailureInput = {
  errorMessage: string;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
};

type UpsertGeocodingCacheSuccessInput = {
  lat: number;
  lng: number;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
};

@Injectable()
export class GeocodeRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findCacheByNormalizedQuery(normalizedQuery: string): Promise<GeocodingCacheRecord | null> {
    const result = await this.pool.query<GeocodingCacheRow>(
      `
        SELECT
          query,
          normalized_query AS "normalizedQuery",
          provider,
          status,
          lat::text AS lat,
          lng::text AS lng,
          raw_response AS "rawResponse",
          error_message AS "errorMessage"
        FROM geocoding_cache
        WHERE normalized_query = $1
        LIMIT 1
      `,
      [normalizedQuery],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      ...row,
      lat: row.lat === null ? null : Number(row.lat),
      lng: row.lng === null ? null : Number(row.lng),
    };
  }

  async touchLastUsedAt(normalizedQuery: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE geocoding_cache
        SET
          last_used_at = now(),
          updated_at = now()
        WHERE normalized_query = $1
      `,
      [normalizedQuery],
    );
  }

  async upsertFailure(input: UpsertGeocodingCacheFailureInput): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO geocoding_cache (
          query,
          normalized_query,
          provider,
          status,
          lat,
          lng,
          location,
          raw_response,
          error_message,
          requested_at,
          last_used_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'failed',
          null,
          null,
          null,
          $4::jsonb,
          $5,
          now(),
          now(),
          now(),
          now()
        )
        ON CONFLICT (normalized_query)
        DO UPDATE SET
          query = EXCLUDED.query,
          provider = EXCLUDED.provider,
          status = 'failed',
          lat = null,
          lng = null,
          location = null,
          raw_response = EXCLUDED.raw_response,
          error_message = EXCLUDED.error_message,
          requested_at = now(),
          last_used_at = now(),
          updated_at = now()
      `,
      [
        input.query,
        input.normalizedQuery,
        input.provider,
        JSON.stringify(input.rawResponse),
        input.errorMessage,
      ],
    );
  }

  async upsertSuccess(input: UpsertGeocodingCacheSuccessInput): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO geocoding_cache (
          query,
          normalized_query,
          provider,
          status,
          lat,
          lng,
          location,
          raw_response,
          error_message,
          requested_at,
          last_used_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'success',
          $4::numeric(10, 7),
          $5::numeric(10, 7),
          ST_SetSRID(ST_MakePoint($5::numeric(10, 7), $4::numeric(10, 7)), 4326),
          $6::jsonb,
          null,
          now(),
          now(),
          now(),
          now()
        )
        ON CONFLICT (normalized_query)
        DO UPDATE SET
          query = EXCLUDED.query,
          provider = EXCLUDED.provider,
          status = 'success',
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          location = EXCLUDED.location,
          raw_response = EXCLUDED.raw_response,
          error_message = null,
          requested_at = now(),
          last_used_at = now(),
          updated_at = now()
      `,
      [
        input.query,
        input.normalizedQuery,
        input.provider,
        input.lat,
        input.lng,
        JSON.stringify(input.rawResponse),
      ],
    );
  }
}
