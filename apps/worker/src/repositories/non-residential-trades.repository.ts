import type { PoolClient } from 'pg';

import type { NonResidentialTradeUpsertInput } from '../parsers/molit-nrg-trade.parser';

type UpsertResultRow = {
  inserted: boolean;
};

export type UpsertTradeResult = {
  inserted: boolean;
};

export type PendingGeocodingTrade = {
  geocodingQuery: string;
  id: string;
};

export type GeocodingCacheRecord = {
  errorMessage: string | null;
  id: string;
  lat: number | null;
  lng: number | null;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
  status: 'failed' | 'success';
};

type PendingGeocodingTradeRow = {
  geocodingQuery: string;
  id: string;
};

type GeocodingCacheRow = {
  errorMessage: string | null;
  id: string;
  lat: string | null;
  lng: string | null;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
  status: 'failed' | 'success';
};

type UpsertGeocodingCacheSuccessInput = {
  lat: number;
  lng: number;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
};

type UpsertGeocodingCacheFailureInput = {
  errorMessage: string;
  normalizedQuery: string;
  provider: string;
  query: string;
  rawResponse: unknown;
};

export class NonResidentialTradesRepository {
  constructor(private readonly client: PoolClient) {}

  async upsertTrade(input: NonResidentialTradeUpsertInput): Promise<UpsertTradeResult> {
    const values = [
      input.source,
      input.sourceRequestLawdCd,
      input.sourceRequestYm,
      input.sourceRequestKey,
      input.sourceRowHash,
      JSON.stringify(input.raw),
      input.sggCd,
      input.sggNm,
      input.umdNm,
      input.jibun,
      input.isJibunMasked,
      input.geocodingQuery,
      input.dealYear,
      input.dealMonth,
      input.dealDay,
      input.dealDate,
      input.dealAmountManwon,
      input.dealingGbn,
      input.buyerGbn,
      input.sellerGbn,
      input.estateAgentSggNm,
      input.buildYear,
      input.buildingArea,
      input.buildingType,
      input.buildingUse,
      input.landUse,
      input.plottageArea,
      input.floor,
      input.cdealType,
      input.canceledAt,
      input.isCanceled,
      input.shareDealingType,
      input.isShareDeal,
      input.needsGeocoding,
      input.geocodingStatus,
      input.geocodingUpdatedAt,
    ];

    const result = await this.client.query<UpsertResultRow>(
      `
        INSERT INTO non_residential_trades (
          source,
          source_request_lawd_cd,
          source_request_ym,
          source_request_key,
          source_row_hash,
          raw,
          sgg_cd,
          sgg_nm,
          umd_nm,
          jibun,
          is_jibun_masked,
          geocoding_query,
          deal_year,
          deal_month,
          deal_day,
          deal_date,
          deal_amount_manwon,
          dealing_gbn,
          buyer_gbn,
          seller_gbn,
          estate_agent_sgg_nm,
          build_year,
          building_area,
          building_type,
          building_use,
          land_use,
          plottage_area,
          floor,
          cdeal_type,
          canceled_at,
          is_canceled,
          share_dealing_type,
          is_share_deal,
          needs_geocoding,
          geocoding_status,
          geocoding_updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::jsonb,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16::date,
          $17,
          $18,
          $19,
          $20,
          $21,
          $22,
          $23::numeric(14, 4),
          $24,
          $25,
          $26,
          $27::numeric(14, 4),
          $28,
          $29,
          $30::date,
          $31,
          $32,
          $33,
          $34,
          $35,
          $36::timestamptz
        )
        ON CONFLICT (source_row_hash)
        DO UPDATE SET
          source_request_lawd_cd = EXCLUDED.source_request_lawd_cd,
          source_request_ym = EXCLUDED.source_request_ym,
          source_request_key = EXCLUDED.source_request_key,
          raw = EXCLUDED.raw,
          last_seen_at = now(),
          sgg_cd = EXCLUDED.sgg_cd,
          sgg_nm = EXCLUDED.sgg_nm,
          umd_nm = EXCLUDED.umd_nm,
          jibun = EXCLUDED.jibun,
          is_jibun_masked = EXCLUDED.is_jibun_masked,
          geocoding_query = CASE
            WHEN non_residential_trades.geocoding_status = 'success'
              THEN non_residential_trades.geocoding_query
            ELSE EXCLUDED.geocoding_query
          END,
          deal_year = EXCLUDED.deal_year,
          deal_month = EXCLUDED.deal_month,
          deal_day = EXCLUDED.deal_day,
          deal_date = EXCLUDED.deal_date,
          deal_amount_manwon = EXCLUDED.deal_amount_manwon,
          dealing_gbn = EXCLUDED.dealing_gbn,
          buyer_gbn = EXCLUDED.buyer_gbn,
          seller_gbn = EXCLUDED.seller_gbn,
          estate_agent_sgg_nm = EXCLUDED.estate_agent_sgg_nm,
          build_year = EXCLUDED.build_year,
          building_area = EXCLUDED.building_area,
          building_type = EXCLUDED.building_type,
          building_use = EXCLUDED.building_use,
          land_use = EXCLUDED.land_use,
          plottage_area = EXCLUDED.plottage_area,
          floor = EXCLUDED.floor,
          cdeal_type = EXCLUDED.cdeal_type,
          canceled_at = EXCLUDED.canceled_at,
          is_canceled = EXCLUDED.is_canceled,
          share_dealing_type = EXCLUDED.share_dealing_type,
          is_share_deal = EXCLUDED.is_share_deal,
          needs_geocoding = CASE
            WHEN non_residential_trades.geocoding_status = 'success'
              THEN non_residential_trades.needs_geocoding
            WHEN EXCLUDED.is_jibun_masked
              THEN false
            ELSE true
          END,
          geocoding_status = CASE
            WHEN non_residential_trades.geocoding_status = 'success'
              THEN non_residential_trades.geocoding_status
            WHEN EXCLUDED.is_jibun_masked
              THEN 'skipped'
            ELSE 'pending'
          END,
          geocoding_updated_at = CASE
            WHEN non_residential_trades.geocoding_status = 'success'
              THEN non_residential_trades.geocoding_updated_at
            WHEN EXCLUDED.is_jibun_masked
              THEN now()
            ELSE non_residential_trades.geocoding_updated_at
          END,
          geocoding_error_message = CASE
            WHEN non_residential_trades.geocoding_status = 'success'
              THEN non_residential_trades.geocoding_error_message
            WHEN EXCLUDED.is_jibun_masked
              THEN null
            ELSE non_residential_trades.geocoding_error_message
          END,
          updated_at = now()
        RETURNING (xmax = 0) AS inserted
      `,
      values,
    );

    return {
      inserted: result.rows[0]?.inserted === true,
    };
  }

  async findPendingGeocodingTrades(limit: number): Promise<PendingGeocodingTrade[]> {
    const result = await this.client.query<PendingGeocodingTradeRow>(
      `
        SELECT
          id::text AS id,
          geocoding_query AS "geocodingQuery"
        FROM non_residential_trades
        WHERE needs_geocoding = true
          AND geocoding_status = 'pending'
          AND is_jibun_masked = false
          AND geocoding_query IS NOT NULL
        ORDER BY id
        LIMIT $1
      `,
      [limit],
    );

    return result.rows;
  }

  async findGeocodingCacheByNormalizedQuery(
    normalizedQuery: string,
  ): Promise<GeocodingCacheRecord | null> {
    const result = await this.client.query<GeocodingCacheRow>(
      `
        SELECT
          id::text AS id,
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

  async touchGeocodingCacheLastUsedAt(normalizedQuery: string): Promise<void> {
    await this.client.query(
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

  async upsertGeocodingCacheSuccess(input: UpsertGeocodingCacheSuccessInput): Promise<void> {
    await this.client.query(
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

  async upsertGeocodingCacheFailure(input: UpsertGeocodingCacheFailureInput): Promise<void> {
    await this.client.query(
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

  async markTradeGeocodingSuccess(
    tradeId: string,
    provider: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    await this.client.query(
      `
        UPDATE non_residential_trades
        SET
          lat = $2::numeric(10, 7),
          lng = $3::numeric(10, 7),
          location = ST_SetSRID(ST_MakePoint($3::numeric(10, 7), $2::numeric(10, 7)), 4326),
          needs_geocoding = false,
          geocoding_status = 'success',
          geocoding_provider = $4,
          geocoding_updated_at = now(),
          geocoding_error_message = null,
          updated_at = now()
        WHERE id = $1::bigint
      `,
      [tradeId, lat, lng, provider],
    );
  }

  async markTradeGeocodingFailure(
    tradeId: string,
    provider: string,
    errorMessage: string,
  ): Promise<void> {
    await this.client.query(
      `
        UPDATE non_residential_trades
        SET
          needs_geocoding = false,
          geocoding_status = 'failed',
          geocoding_provider = $2,
          geocoding_updated_at = now(),
          geocoding_error_message = $3,
          updated_at = now()
        WHERE id = $1::bigint
      `,
      [tradeId, provider, errorMessage],
    );
  }

  async markTradeGeocodingTransientFailure(
    tradeId: string,
    provider: string,
    errorMessage: string,
  ): Promise<void> {
    await this.client.query(
      `
        UPDATE non_residential_trades
        SET
          needs_geocoding = true,
          geocoding_status = 'pending',
          geocoding_provider = $2,
          geocoding_updated_at = now(),
          geocoding_error_message = $3,
          updated_at = now()
        WHERE id = $1::bigint
      `,
      [tradeId, provider, errorMessage],
    );
  }
}
