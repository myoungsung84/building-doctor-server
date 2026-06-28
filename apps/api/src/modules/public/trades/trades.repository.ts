import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

import { PG_POOL } from '@app/db';

type NearbyTradeQueryInput = {
  buildingUse?: string;
  centerLat: number;
  centerLng: number;
  excludeShareDeals: boolean;
  fromDate: string;
  includeCanceled: boolean;
  radiusMeters: number;
  toDate: string;
};

type TradeSummaryQueryInput = {
  buildingUse?: string;
  excludeShareDeals: boolean;
  fromDate: string;
  includeCanceled: boolean;
  sggCd?: string;
  sidoCd?: string;
  toDate: string;
};

export type NearbyTradeRow = {
  buildingAreaSqm: number | null;
  buildingType: string | null;
  buildingUse: string | null;
  dealAmountManwon: number;
  dealDate: string;
  distanceMeters: number;
  floor: number | null;
  id: number;
  isCanceled: boolean;
  isShareDeal: boolean;
  jibun: string;
  lat: number;
  lng: number;
  sggCd: string;
  sggNm: string;
  umdNm: string;
};

type TradeHistoryQueryInput = {
  excludeShareDeals: boolean;
  includeCanceled: boolean;
  jibun: string;
  sggCd: string;
  umdNm: string;
};

export type TradeHistoryRow = {
  buildingAreaSqm: number | null;
  buildingType: string | null;
  buildingUse: string | null;
  buyerGbn: string | null;
  dealAmountManwon: number;
  dealDate: string;
  dealingGbn: string | null;
  floor: number | null;
  id: number;
  isCanceled: boolean;
  isShareDeal: boolean;
  jibun: string;
  lat: number | null;
  lng: number | null;
  sellerGbn: string | null;
  sggCd: string;
  sggNm: string;
  umdNm: string;
};

export type TradeSummaryRow = {
  buildingAreaSqm: number | null;
  buildingUse: string | null;
  dealAmountManwon: number;
  dealDate: string;
  jibun: string;
  lat: number;
  lng: number;
  sggCd: string;
  sggNm: string;
  umdNm: string;
};

export type DataStatusRow = {
  failed: number;
  fromYm: string | null;
  geocoded: number;
  lawdCd: string | null;
  masked: number;
  sggNm: string | null;
  total: number;
  toYm: string | null;
};

export type PeriodBounds = {
  fromYm: string | null;
  toYm: string | null;
};

@Injectable()
export class TradesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findDataStatus(): Promise<DataStatusRow> {
    const result = await this.pool.query<DataStatusRow>(
      `
        SELECT
          MIN(source_request_ym) AS "fromYm",
          MAX(source_request_ym) AS "toYm",
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE geocoding_status = 'success')::int AS geocoded,
          COUNT(*) FILTER (WHERE is_jibun_masked = true)::int AS masked,
          COUNT(*) FILTER (WHERE geocoding_status = 'failed')::int AS failed,
          MIN(source_request_lawd_cd) AS "lawdCd",
          MIN(sgg_nm) AS "sggNm"
        FROM non_residential_trades
      `,
    );

    return (
      result.rows[0] ?? {
        failed: 0,
        fromYm: null,
        geocoded: 0,
        lawdCd: null,
        masked: 0,
        sggNm: null,
        total: 0,
        toYm: null,
      }
    );
  }

  async findNearbyTradeRows(query: NearbyTradeQueryInput): Promise<NearbyTradeRow[]> {
    const values: Array<number | string> = [
      query.centerLng,
      query.centerLat,
      query.radiusMeters,
      query.fromDate,
      query.toDate,
    ];
    const conditions = [
      'is_jibun_masked = false',
      'location IS NOT NULL',
      `ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )`,
      'deal_date BETWEEN $4::date AND $5::date',
    ];

    if (!query.includeCanceled) {
      conditions.push('is_canceled = false');
    }

    if (query.excludeShareDeals) {
      conditions.push('is_share_deal = false');
    }

    if (query.buildingUse) {
      values.push(query.buildingUse);
      conditions.push(`building_use = $${values.length}`);
    }

    const result = await this.pool.query<NearbyTradeRow>(
      `
        SELECT
          id,
          sgg_cd AS "sggCd",
          sgg_nm AS "sggNm",
          umd_nm AS "umdNm",
          jibun,
          lat::float8 AS lat,
          lng::float8 AS lng,
          ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          )::float8 AS "distanceMeters",
          deal_date::text AS "dealDate",
          deal_amount_manwon::int8 AS "dealAmountManwon",
          building_area::float8 AS "buildingAreaSqm",
          building_type AS "buildingType",
          building_use AS "buildingUse",
          floor,
          is_canceled AS "isCanceled",
          is_share_deal AS "isShareDeal"
        FROM non_residential_trades
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY deal_date DESC, id DESC
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      dealAmountManwon: Number(row.dealAmountManwon),
      id: Number(row.id),
    }));
  }

  async findTradeSummaryRows(query: TradeSummaryQueryInput): Promise<TradeSummaryRow[]> {
    const values: Array<string> = [query.fromDate, query.toDate];
    const conditions = [
      'is_jibun_masked = false',
      'location IS NOT NULL',
      'deal_date BETWEEN $1::date AND $2::date',
    ];

    if (!query.includeCanceled) {
      conditions.push('is_canceled = false');
    }

    if (query.excludeShareDeals) {
      conditions.push('is_share_deal = false');
    }

    if (query.buildingUse) {
      values.push(query.buildingUse);
      conditions.push(`building_use = $${values.length}`);
    }

    if (query.sidoCd) {
      values.push(query.sidoCd);
      conditions.push(`LEFT(sgg_cd, 2) = $${values.length}`);
    }

    if (query.sggCd) {
      values.push(query.sggCd);
      conditions.push(`sgg_cd = $${values.length}`);
    }

    const result = await this.pool.query<TradeSummaryRow>(
      `
        SELECT
          sgg_cd AS "sggCd",
          sgg_nm AS "sggNm",
          umd_nm AS "umdNm",
          jibun,
          lat::float8 AS lat,
          lng::float8 AS lng,
          deal_date::text AS "dealDate",
          deal_amount_manwon::int8 AS "dealAmountManwon",
          building_area::float8 AS "buildingAreaSqm",
          building_use AS "buildingUse"
        FROM non_residential_trades
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY deal_date DESC, sgg_cd ASC, umd_nm ASC, jibun ASC
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      dealAmountManwon: Number(row.dealAmountManwon),
    }));
  }

  async findPeriodBounds(): Promise<PeriodBounds> {
    const result = await this.pool.query<PeriodBounds>(
      `
        SELECT
          MIN(source_request_ym) AS "fromYm",
          MAX(source_request_ym) AS "toYm"
        FROM non_residential_trades
      `,
    );

    return result.rows[0] ?? { fromYm: null, toYm: null };
  }

  async findTradeHistoryRows(query: TradeHistoryQueryInput): Promise<TradeHistoryRow[]> {
    const values: Array<string> = [query.sggCd, query.umdNm, query.jibun];
    const conditions = ['sgg_cd = $1', 'umd_nm = $2', 'jibun = $3', 'is_jibun_masked = false'];

    if (!query.includeCanceled) {
      conditions.push('is_canceled = false');
    }

    if (query.excludeShareDeals) {
      conditions.push('is_share_deal = false');
    }

    const result = await this.pool.query<TradeHistoryRow>(
      `
        SELECT
          id,
          sgg_cd AS "sggCd",
          sgg_nm AS "sggNm",
          umd_nm AS "umdNm",
          jibun,
          lat::float8 AS lat,
          lng::float8 AS lng,
          deal_date::text AS "dealDate",
          deal_amount_manwon::int8 AS "dealAmountManwon",
          building_area::float8 AS "buildingAreaSqm",
          building_type AS "buildingType",
          building_use AS "buildingUse",
          floor,
          is_canceled AS "isCanceled",
          is_share_deal AS "isShareDeal",
          dealing_gbn AS "dealingGbn",
          buyer_gbn AS "buyerGbn",
          seller_gbn AS "sellerGbn"
        FROM non_residential_trades
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY deal_date DESC, id DESC
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      dealAmountManwon: Number(row.dealAmountManwon),
      id: Number(row.id),
    }));
  }
}
