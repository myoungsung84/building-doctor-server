import type { PoolClient } from 'pg';

import type { NonResidentialTradeUpsertInput } from '../parsers/molit-nrg-trade.parser';

type UpsertResultRow = {
  inserted: boolean;
};

export type UpsertTradeResult = {
  inserted: boolean;
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
}
