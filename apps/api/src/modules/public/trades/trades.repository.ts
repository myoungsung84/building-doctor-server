import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

import { PG_POOL } from '@app/db';
import type { CommonGroupChildrenSort, ParcelGroupChildrenSort } from './dto/group-children.query';

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

type MapBoundsQueryInput = {
  east: number;
  excludeShareDeal: boolean;
  fromDate: string;
  includeCanceled: boolean;
  limit: number;
  north: number;
  south: number;
  toDate: string;
  west: number;
};

type GroupChildrenBaseQueryInput = {
  excludeShareDeal: boolean;
  fromDate: string;
  includeCanceled: boolean;
  page: number;
  pageSize: number;
  toDate: string;
};

type DistrictChildrenQueryInput = GroupChildrenBaseQueryInput & {
  sidoCd: string;
  sort: CommonGroupChildrenSort;
};

type DistrictChildrenCountQueryInput = Omit<DistrictChildrenQueryInput, 'page' | 'pageSize' | 'sort'>;

type DongChildrenQueryInput = GroupChildrenBaseQueryInput & {
  sggCd: string;
  sort: CommonGroupChildrenSort;
};

type DongChildrenCountQueryInput = Omit<DongChildrenQueryInput, 'page' | 'pageSize' | 'sort'>;

type ParcelChildrenQueryInput = GroupChildrenBaseQueryInput & {
  sggCd: string;
  sort: ParcelGroupChildrenSort;
  umdNm: string;
};

type ParcelChildrenCountQueryInput = Omit<ParcelChildrenQueryInput, 'page' | 'pageSize' | 'sort'>;

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

export type MapParcelTradeRow = {
  avgDealAmount: number | null;
  buildingAreaSqm: number | null;
  buildingUse: string | null;
  dealAmountManwon: number;
  dealDate: string;
  floor: number | null;
  id: number;
  isCanceled: boolean;
  isShareDeal: boolean;
  jibun: string;
  lat: number;
  latestBuildingArea: number | null;
  latestDealAmount: number;
  latestDealDate: string;
  latestFloor: number | null;
  lng: number;
  medianDealAmount: number | null;
  sggCd: string;
  sggNm: string;
  tradeCount: number;
  umdNm: string;
};

export type MapDongSummaryRow = {
  avgDealAmount: number | null;
  lat: number;
  lng: number;
  medianDealAmount: number | null;
  sggCd: string;
  tradeCount: number;
  umdNm: string;
};

export type MapDistrictSummaryRow = {
  avgDealAmount: number | null;
  lat: number;
  lng: number;
  medianDealAmount: number | null;
  sggCd: string;
  sggName: string;
  tradeCount: number;
};

export type MapCitySummaryRow = {
  avgDealAmount: number | null;
  lat: number;
  lng: number;
  medianDealAmount: number | null;
  sidoCd: string;
  tradeCount: number;
};

export type DistrictGroupChildRow = {
  avgDealAmount: number | null;
  avgPricePerPyeong: number | null;
  lat: number;
  latestDealDate: string;
  lng: number;
  medianDealAmount: number | null;
  medianPricePerPyeong: number | null;
  parcelCount: number;
  sggCd: string;
  sggName: string;
  tradeCount: number;
};

export type DongGroupChildRow = {
  avgDealAmount: number | null;
  avgPricePerPyeong: number | null;
  lat: number;
  latestDealDate: string;
  lng: number;
  medianDealAmount: number | null;
  medianPricePerPyeong: number | null;
  parcelCount: number;
  sggCd: string;
  sggName: string;
  tradeCount: number;
  umdNm: string;
};

export type ParcelGroupChildRow = {
  avgDealAmount: number | null;
  avgPricePerPyeong: number | null;
  buildingArea: number | null;
  floor: number | null;
  jibun: string;
  lat: number;
  latestDealAmount: number;
  latestDealDate: string;
  lng: number;
  medianDealAmount: number | null;
  medianPricePerPyeong: number | null;
  sggCd: string;
  tradeCount: number;
  tradeId: number;
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

  private buildBoundsWhereClause(query: MapBoundsQueryInput) {
    const values: Array<number | string> = [
      query.west,
      query.south,
      query.east,
      query.north,
      query.fromDate,
      query.toDate,
    ];
    const conditions = [
      'is_jibun_masked = false',
      'location IS NOT NULL',
      'lat IS NOT NULL',
      'lng IS NOT NULL',
      'ST_Intersects(location, ST_MakeEnvelope($1, $2, $3, $4, 4326))',
      'deal_date BETWEEN $5::date AND $6::date',
    ];

    if (!query.includeCanceled) {
      conditions.push('is_canceled = false');
    }

    if (query.excludeShareDeal) {
      conditions.push('is_share_deal = false');
    }

    return { conditions, values };
  }

  private buildGroupChildrenWhereClause(
    query:
      | DistrictChildrenCountQueryInput
      | DongChildrenCountQueryInput
      | ParcelChildrenCountQueryInput,
  ) {
    const values: Array<string | number> = [query.fromDate, query.toDate];
    const conditions = [
      'is_jibun_masked = false',
      'location IS NOT NULL',
      'lat IS NOT NULL',
      'lng IS NOT NULL',
      'deal_date BETWEEN $1::date AND $2::date',
    ];

    if (!query.includeCanceled) {
      conditions.push('is_canceled = false');
    }

    if (query.excludeShareDeal) {
      conditions.push('is_share_deal = false');
    }

    if ('sidoCd' in query) {
      values.push(query.sidoCd);
      conditions.push(`LEFT(sgg_cd, 2) = $${values.length}`);
    }

    if ('sggCd' in query) {
      values.push(query.sggCd);
      conditions.push(`sgg_cd = $${values.length}`);
    }

    if ('umdNm' in query) {
      values.push(query.umdNm);
      conditions.push(`umd_nm = $${values.length}`);
      conditions.push("jibun IS NOT NULL");
      conditions.push("BTRIM(jibun) <> ''");
    }

    return { conditions, values };
  }

  private resolveDistrictChildrenSortClause(sort: CommonGroupChildrenSort): string {
    switch (sort) {
      case 'parcelCount_desc':
        return `"parcelCount" DESC, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC`;
      case 'avgDealAmount_desc':
        return `"avgDealAmount" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC`;
      case 'medianDealAmount_desc':
        return `"medianDealAmount" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC`;
      case 'avgPricePerPyeong_desc':
        return `"avgPricePerPyeong" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC`;
      case 'medianPricePerPyeong_desc':
        return `"medianPricePerPyeong" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC`;
      case 'latestDealDate_desc':
        return `"latestDealDate" DESC, "tradeCount" DESC, "sggCd" ASC`;
      case 'tradeCount_desc':
      default:
        return `"tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC`;
    }
  }

  private resolveDongChildrenSortClause(sort: CommonGroupChildrenSort): string {
    switch (sort) {
      case 'parcelCount_desc':
        return `"parcelCount" DESC, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC, "umdNm" ASC`;
      case 'avgDealAmount_desc':
        return `"avgDealAmount" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC, "umdNm" ASC`;
      case 'medianDealAmount_desc':
        return `"medianDealAmount" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC, "umdNm" ASC`;
      case 'avgPricePerPyeong_desc':
        return `"avgPricePerPyeong" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC, "umdNm" ASC`;
      case 'medianPricePerPyeong_desc':
        return `"medianPricePerPyeong" DESC NULLS LAST, "tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC, "umdNm" ASC`;
      case 'latestDealDate_desc':
        return `"latestDealDate" DESC, "tradeCount" DESC, "sggCd" ASC, "umdNm" ASC`;
      case 'tradeCount_desc':
      default:
        return `"tradeCount" DESC, "latestDealDate" DESC, "sggCd" ASC, "umdNm" ASC`;
    }
  }

  private resolveParcelChildrenSortClause(sort: ParcelGroupChildrenSort): string {
    switch (sort) {
      case 'tradeCount_desc':
        return `"tradeCount" DESC, "latestDealDate" DESC, "latestDealAmount" DESC, "jibun" ASC`;
      case 'parcelCount_desc':
        return `"latestDealDate" DESC, "tradeCount" DESC, "latestDealAmount" DESC, "jibun" ASC`;
      case 'avgDealAmount_desc':
        return `"avgDealAmount" DESC NULLS LAST, "latestDealDate" DESC, "tradeCount" DESC, "jibun" ASC`;
      case 'medianDealAmount_desc':
        return `"medianDealAmount" DESC NULLS LAST, "latestDealDate" DESC, "tradeCount" DESC, "jibun" ASC`;
      case 'avgPricePerPyeong_desc':
        return `"avgPricePerPyeong" DESC NULLS LAST, "latestDealDate" DESC, "tradeCount" DESC, "jibun" ASC`;
      case 'medianPricePerPyeong_desc':
        return `"medianPricePerPyeong" DESC NULLS LAST, "latestDealDate" DESC, "tradeCount" DESC, "jibun" ASC`;
      case 'latestDealAmount_desc':
        return `"latestDealAmount" DESC, "latestDealDate" DESC, "tradeCount" DESC, "jibun" ASC`;
      case 'latestDealDate_desc':
      default:
        return `"latestDealDate" DESC, "tradeCount" DESC, "latestDealAmount" DESC, "jibun" ASC`;
    }
  }

  private getPaginationParams(page: number, pageSize: number) {
    return {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
  }

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

  async findParcelTradesInBounds(query: MapBoundsQueryInput): Promise<MapParcelTradeRow[]> {
    const { conditions, values } = this.buildBoundsWhereClause(query);

    values.push(query.limit);

    const result = await this.pool.query<MapParcelTradeRow>(
      `
        WITH base AS (
          SELECT
            id,
            sgg_cd,
            sgg_nm,
            umd_nm,
            jibun,
            lat::float8 AS lat,
            lng::float8 AS lng,
            deal_date,
            deal_amount_manwon,
            building_area,
            building_use,
            floor,
            is_canceled,
            is_share_deal
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
        ),
        latest AS (
          SELECT
            id,
            sgg_cd,
            sgg_nm,
            umd_nm,
            jibun,
            deal_date,
            deal_amount_manwon,
            building_area,
            building_use,
            floor,
            is_canceled,
            is_share_deal
          FROM (
            SELECT
              base.*,
              ROW_NUMBER() OVER (
                PARTITION BY sgg_cd, umd_nm, jibun
                ORDER BY deal_date DESC, id DESC
              ) AS rn
            FROM base
          ) ranked
          WHERE rn = 1
        ),
        summary AS (
          SELECT
            sgg_cd,
            MIN(sgg_nm) AS sgg_nm,
            umd_nm,
            jibun,
            AVG(lat)::float8 AS lat,
            AVG(lng)::float8 AS lng,
            COUNT(*)::int AS trade_count,
            ROUND(AVG(deal_amount_manwon))::int8 AS avg_deal_amount,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS median_deal_amount,
            MAX(deal_date) AS latest_deal_date
          FROM base
          GROUP BY sgg_cd, umd_nm, jibun
        )
        SELECT
          latest.id,
          summary.sgg_cd AS "sggCd",
          summary.sgg_nm AS "sggNm",
          summary.umd_nm AS "umdNm",
          summary.jibun,
          summary.lat,
          summary.lng,
          summary.trade_count AS "tradeCount",
          summary.avg_deal_amount AS "avgDealAmount",
          summary.median_deal_amount AS "medianDealAmount",
          summary.latest_deal_date::text AS "latestDealDate",
          latest.deal_amount_manwon::int8 AS "latestDealAmount",
          latest.building_area::float8 AS "latestBuildingArea",
          latest.floor AS "latestFloor",
          latest.building_use AS "buildingUse",
          latest.is_canceled AS "isCanceled",
          latest.is_share_deal AS "isShareDeal",
          latest.deal_date::text AS "dealDate",
          latest.deal_amount_manwon::int8 AS "dealAmountManwon",
          latest.building_area::float8 AS "buildingAreaSqm",
          latest.floor
        FROM summary
        JOIN latest
          ON latest.sgg_cd = summary.sgg_cd
         AND latest.umd_nm = summary.umd_nm
         AND latest.jibun = summary.jibun
        ORDER BY
          summary.latest_deal_date DESC,
          summary.trade_count DESC,
          latest.deal_amount_manwon DESC,
          summary.sgg_cd ASC,
          summary.umd_nm ASC,
          summary.jibun ASC
        LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount:
        row.avgDealAmount === null || row.avgDealAmount === undefined
          ? null
          : Number(row.avgDealAmount),
      dealAmountManwon: Number(row.dealAmountManwon),
      id: Number(row.id),
      latestDealAmount: Number(row.latestDealAmount),
      medianDealAmount:
        row.medianDealAmount === null || row.medianDealAmount === undefined
          ? null
          : Number(row.medianDealAmount),
      tradeCount: Number(row.tradeCount),
    }));
  }

  async findDongSummariesInBounds(query: MapBoundsQueryInput): Promise<MapDongSummaryRow[]> {
    const { conditions, values } = this.buildBoundsWhereClause(query);

    values.push(query.limit);

    const result = await this.pool.query<MapDongSummaryRow>(
      `
        SELECT
          sgg_cd AS "sggCd",
          umd_nm AS "umdNm",
          COUNT(*)::int AS "tradeCount",
          ROUND(AVG(deal_amount_manwon))::int8 AS "avgDealAmount",
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS "medianDealAmount",
          AVG(lat)::float8 AS lat,
          AVG(lng)::float8 AS lng
        FROM non_residential_trades
        WHERE ${conditions.join('\n          AND ')}
        GROUP BY sgg_cd, umd_nm
        ORDER BY COUNT(*) DESC, MAX(deal_date) DESC, sgg_cd ASC, umd_nm ASC
        LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount:
        row.avgDealAmount === null || row.avgDealAmount === undefined
          ? null
          : Number(row.avgDealAmount),
      medianDealAmount:
        row.medianDealAmount === null || row.medianDealAmount === undefined
          ? null
          : Number(row.medianDealAmount),
      tradeCount: Number(row.tradeCount),
    }));
  }

  async findDistrictSummariesInBounds(
    query: MapBoundsQueryInput,
  ): Promise<MapDistrictSummaryRow[]> {
    const { conditions, values } = this.buildBoundsWhereClause(query);

    values.push(query.limit);

    const result = await this.pool.query<MapDistrictSummaryRow>(
      `
        SELECT
          sgg_cd AS "sggCd",
          MIN(sgg_nm) AS "sggName",
          COUNT(*)::int AS "tradeCount",
          ROUND(AVG(deal_amount_manwon))::int8 AS "avgDealAmount",
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS "medianDealAmount",
          AVG(lat)::float8 AS lat,
          AVG(lng)::float8 AS lng
        FROM non_residential_trades
        WHERE ${conditions.join('\n          AND ')}
        GROUP BY sgg_cd
        ORDER BY COUNT(*) DESC, MAX(deal_date) DESC, sgg_cd ASC
        LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount:
        row.avgDealAmount === null || row.avgDealAmount === undefined
          ? null
          : Number(row.avgDealAmount),
      medianDealAmount:
        row.medianDealAmount === null || row.medianDealAmount === undefined
          ? null
          : Number(row.medianDealAmount),
      tradeCount: Number(row.tradeCount),
    }));
  }

  async findCitySummariesInBounds(query: MapBoundsQueryInput): Promise<MapCitySummaryRow[]> {
    const { conditions, values } = this.buildBoundsWhereClause(query);

    values.push(query.limit);

    const result = await this.pool.query<MapCitySummaryRow>(
      `
        SELECT
          LEFT(sgg_cd, 2) AS "sidoCd",
          COUNT(*)::int AS "tradeCount",
          ROUND(AVG(deal_amount_manwon))::int8 AS "avgDealAmount",
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS "medianDealAmount",
          AVG(lat)::float8 AS lat,
          AVG(lng)::float8 AS lng
        FROM non_residential_trades
        WHERE ${conditions.join('\n          AND ')}
        GROUP BY LEFT(sgg_cd, 2)
        ORDER BY COUNT(*) DESC, MAX(deal_date) DESC, LEFT(sgg_cd, 2) ASC
        LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount:
        row.avgDealAmount === null || row.avgDealAmount === undefined
          ? null
          : Number(row.avgDealAmount),
      medianDealAmount:
        row.medianDealAmount === null || row.medianDealAmount === undefined
          ? null
          : Number(row.medianDealAmount),
      tradeCount: Number(row.tradeCount),
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

  async countDistrictChildren(query: DistrictChildrenCountQueryInput): Promise<number> {
    const { conditions, values } = this.buildGroupChildrenWhereClause(query);
    const result = await this.pool.query<{ totalCount: number }>(
      `
        WITH grouped AS (
          SELECT sgg_cd
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
          GROUP BY sgg_cd
        )
        SELECT COUNT(*)::int AS "totalCount"
        FROM grouped
      `,
      values,
    );

    return Number(result.rows[0]?.totalCount ?? 0);
  }

  async findDistrictChildren(query: DistrictChildrenQueryInput): Promise<DistrictGroupChildRow[]> {
    const { conditions, values } = this.buildGroupChildrenWhereClause(query);
    const orderBy = this.resolveDistrictChildrenSortClause(query.sort);
    const { limit, offset } = this.getPaginationParams(query.page, query.pageSize);

    values.push(limit, offset);

    const result = await this.pool.query<DistrictGroupChildRow>(
      `
        WITH base AS (
          SELECT
            sgg_cd,
            sgg_nm,
            umd_nm,
            jibun,
            lat::float8 AS lat,
            lng::float8 AS lng,
            deal_date,
            deal_amount_manwon,
            CASE
              WHEN building_area IS NOT NULL AND building_area > 0
                THEN deal_amount_manwon::numeric * 3.305785 / building_area
              ELSE NULL
            END AS price_per_pyeong
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
        ),
        grouped AS (
          SELECT
            sgg_cd AS "sggCd",
            MIN(sgg_nm) AS "sggName",
            COUNT(*)::int AS "tradeCount",
            COUNT(
              DISTINCT CASE
                WHEN jibun IS NOT NULL AND BTRIM(jibun) <> ''
                  THEN CONCAT_WS(':', sgg_cd, umd_nm, jibun)
                ELSE NULL
              END
            )::int AS "parcelCount",
            ROUND(AVG(deal_amount_manwon))::int8 AS "avgDealAmount",
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS "medianDealAmount",
            ROUND(AVG(price_per_pyeong), 2) AS "avgPricePerPyeong",
            ROUND(
              (
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_pyeong)
                FILTER (WHERE price_per_pyeong IS NOT NULL)
              )::numeric,
              2
            ) AS "medianPricePerPyeong",
            MAX(deal_date)::text AS "latestDealDate",
            AVG(lat)::float8 AS lat,
            AVG(lng)::float8 AS lng
          FROM base
          GROUP BY sgg_cd
        )
        SELECT
          "sggCd",
          "sggName",
          "tradeCount",
          "parcelCount",
          "avgDealAmount",
          "medianDealAmount",
          "avgPricePerPyeong",
          "medianPricePerPyeong",
          "latestDealDate",
          lat,
          lng
        FROM grouped
        ORDER BY ${orderBy}
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount: row.avgDealAmount === null ? null : Number(row.avgDealAmount),
      avgPricePerPyeong:
        row.avgPricePerPyeong === null ? null : Number(row.avgPricePerPyeong),
      medianDealAmount: row.medianDealAmount === null ? null : Number(row.medianDealAmount),
      medianPricePerPyeong:
        row.medianPricePerPyeong === null ? null : Number(row.medianPricePerPyeong),
      parcelCount: Number(row.parcelCount),
      tradeCount: Number(row.tradeCount),
    }));
  }

  async countDongChildren(query: DongChildrenCountQueryInput): Promise<number> {
    const { conditions, values } = this.buildGroupChildrenWhereClause(query);
    const result = await this.pool.query<{ totalCount: number }>(
      `
        WITH grouped AS (
          SELECT sgg_cd, umd_nm
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
          GROUP BY sgg_cd, umd_nm
        )
        SELECT COUNT(*)::int AS "totalCount"
        FROM grouped
      `,
      values,
    );

    return Number(result.rows[0]?.totalCount ?? 0);
  }

  async findDongChildren(query: DongChildrenQueryInput): Promise<DongGroupChildRow[]> {
    const { conditions, values } = this.buildGroupChildrenWhereClause(query);
    const orderBy = this.resolveDongChildrenSortClause(query.sort);
    const { limit, offset } = this.getPaginationParams(query.page, query.pageSize);

    values.push(limit, offset);

    const result = await this.pool.query<DongGroupChildRow>(
      `
        WITH base AS (
          SELECT
            sgg_cd,
            sgg_nm,
            umd_nm,
            jibun,
            lat::float8 AS lat,
            lng::float8 AS lng,
            deal_date,
            deal_amount_manwon,
            CASE
              WHEN building_area IS NOT NULL AND building_area > 0
                THEN deal_amount_manwon::numeric * 3.305785 / building_area
              ELSE NULL
            END AS price_per_pyeong
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
        ),
        grouped AS (
          SELECT
            sgg_cd AS "sggCd",
            MIN(sgg_nm) AS "sggName",
            umd_nm AS "umdNm",
            COUNT(*)::int AS "tradeCount",
            COUNT(
              DISTINCT CASE
                WHEN jibun IS NOT NULL AND BTRIM(jibun) <> ''
                  THEN CONCAT_WS(':', sgg_cd, umd_nm, jibun)
                ELSE NULL
              END
            )::int AS "parcelCount",
            ROUND(AVG(deal_amount_manwon))::int8 AS "avgDealAmount",
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS "medianDealAmount",
            ROUND(AVG(price_per_pyeong), 2) AS "avgPricePerPyeong",
            ROUND(
              (
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_pyeong)
                FILTER (WHERE price_per_pyeong IS NOT NULL)
              )::numeric,
              2
            ) AS "medianPricePerPyeong",
            MAX(deal_date)::text AS "latestDealDate",
            AVG(lat)::float8 AS lat,
            AVG(lng)::float8 AS lng
          FROM base
          GROUP BY sgg_cd, umd_nm
        )
        SELECT
          "sggCd",
          "sggName",
          "umdNm",
          "tradeCount",
          "parcelCount",
          "avgDealAmount",
          "medianDealAmount",
          "avgPricePerPyeong",
          "medianPricePerPyeong",
          "latestDealDate",
          lat,
          lng
        FROM grouped
        ORDER BY ${orderBy}
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount: row.avgDealAmount === null ? null : Number(row.avgDealAmount),
      avgPricePerPyeong:
        row.avgPricePerPyeong === null ? null : Number(row.avgPricePerPyeong),
      medianDealAmount: row.medianDealAmount === null ? null : Number(row.medianDealAmount),
      medianPricePerPyeong:
        row.medianPricePerPyeong === null ? null : Number(row.medianPricePerPyeong),
      parcelCount: Number(row.parcelCount),
      tradeCount: Number(row.tradeCount),
    }));
  }

  async countParcelChildren(query: ParcelChildrenCountQueryInput): Promise<number> {
    const { conditions, values } = this.buildGroupChildrenWhereClause(query);
    const result = await this.pool.query<{ totalCount: number }>(
      `
        WITH grouped AS (
          SELECT sgg_cd, umd_nm, jibun
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
          GROUP BY sgg_cd, umd_nm, jibun
        )
        SELECT COUNT(*)::int AS "totalCount"
        FROM grouped
      `,
      values,
    );

    return Number(result.rows[0]?.totalCount ?? 0);
  }

  async findParcelChildren(query: ParcelChildrenQueryInput): Promise<ParcelGroupChildRow[]> {
    const { conditions, values } = this.buildGroupChildrenWhereClause(query);
    const orderBy = this.resolveParcelChildrenSortClause(query.sort);
    const { limit, offset } = this.getPaginationParams(query.page, query.pageSize);

    values.push(limit, offset);

    const result = await this.pool.query<ParcelGroupChildRow>(
      `
        WITH base AS (
          SELECT
            id,
            sgg_cd,
            umd_nm,
            jibun,
            lat::float8 AS lat,
            lng::float8 AS lng,
            deal_date,
            deal_amount_manwon,
            building_area::float8 AS building_area,
            floor,
            CASE
              WHEN building_area IS NOT NULL AND building_area > 0
                THEN deal_amount_manwon::numeric * 3.305785 / building_area
              ELSE NULL
            END AS price_per_pyeong
          FROM non_residential_trades
          WHERE ${conditions.join('\n            AND ')}
        ),
        latest AS (
          SELECT
            id,
            sgg_cd,
            umd_nm,
            jibun,
            deal_date,
            deal_amount_manwon,
            building_area,
            floor
          FROM (
            SELECT
              base.*,
              ROW_NUMBER() OVER (
                PARTITION BY sgg_cd, umd_nm, jibun
                ORDER BY deal_date DESC, id DESC
              ) AS rn
            FROM base
          ) ranked
          WHERE rn = 1
        ),
        grouped AS (
          SELECT
            sgg_cd AS "sggCd",
            umd_nm AS "umdNm",
            jibun,
            COUNT(*)::int AS "tradeCount",
            ROUND(AVG(deal_amount_manwon))::int8 AS "avgDealAmount",
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon))::int8 AS "medianDealAmount",
            ROUND(AVG(price_per_pyeong), 2) AS "avgPricePerPyeong",
            ROUND(
              (
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_pyeong)
                FILTER (WHERE price_per_pyeong IS NOT NULL)
              )::numeric,
              2
            ) AS "medianPricePerPyeong",
            MAX(deal_date)::text AS "latestDealDate",
            AVG(lat)::float8 AS lat,
            AVG(lng)::float8 AS lng
          FROM base
          GROUP BY sgg_cd, umd_nm, jibun
        )
        SELECT
          grouped."sggCd",
          grouped."umdNm",
          grouped.jibun,
          grouped."tradeCount",
          grouped."avgDealAmount",
          grouped."medianDealAmount",
          grouped."avgPricePerPyeong",
          grouped."medianPricePerPyeong",
          grouped."latestDealDate",
          grouped.lat,
          grouped.lng,
          latest.id AS "tradeId",
          latest.deal_amount_manwon::int8 AS "latestDealAmount",
          latest.building_area AS "buildingArea",
          latest.floor
        FROM grouped
        JOIN latest
          ON latest.sgg_cd = grouped."sggCd"
         AND latest.umd_nm = grouped."umdNm"
         AND latest.jibun = grouped.jibun
        ORDER BY ${orderBy}
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...row,
      avgDealAmount: row.avgDealAmount === null ? null : Number(row.avgDealAmount),
      avgPricePerPyeong:
        row.avgPricePerPyeong === null ? null : Number(row.avgPricePerPyeong),
      latestDealAmount: Number(row.latestDealAmount),
      medianDealAmount: row.medianDealAmount === null ? null : Number(row.medianDealAmount),
      medianPricePerPyeong:
        row.medianPricePerPyeong === null ? null : Number(row.medianPricePerPyeong),
      tradeCount: Number(row.tradeCount),
      tradeId: Number(row.tradeId),
    }));
  }

  async findDistrictNameBySggCd(sggCd: string): Promise<string | null> {
    const result = await this.pool.query<{ label: string | null }>(
      `
        SELECT MIN(sgg_nm) AS label
        FROM non_residential_trades
        WHERE sgg_cd = $1
      `,
      [sggCd],
    );

    return result.rows[0]?.label ?? null;
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
