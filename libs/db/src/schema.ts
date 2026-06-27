import {
  bigint,
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

const geometryPoint = customType<{
  data: string | null;
  driverData: string | null;
  config: { srid: 4326 };
}>({
  dataType() {
    return 'geometry(Point,4326)';
  },
});

export const nonResidentialTrades = pgTable(
  'non_residential_trades',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    source: varchar('source', { length: 50 }).notNull().default('molit_nrg_trade'),
    sourceRequestLawdCd: varchar('source_request_lawd_cd', { length: 10 }).notNull(),
    sourceRequestYm: varchar('source_request_ym', { length: 6 }).notNull(),
    sourceRequestKey: varchar('source_request_key', { length: 100 }).notNull(),
    sourceRowHash: varchar('source_row_hash', { length: 64 }).notNull(),
    raw: jsonb('raw').notNull(),
    collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    sggCd: varchar('sgg_cd', { length: 10 }).notNull(),
    sggNm: varchar('sgg_nm', { length: 100 }).notNull(),
    umdNm: varchar('umd_nm', { length: 100 }).notNull(),
    jibun: varchar('jibun', { length: 100 }),
    isJibunMasked: boolean('is_jibun_masked').notNull().default(false),
    geocodingQuery: varchar('geocoding_query', { length: 300 }),
    dealYear: integer('deal_year').notNull(),
    dealMonth: integer('deal_month').notNull(),
    dealDay: integer('deal_day').notNull(),
    dealDate: date('deal_date').notNull(),
    dealAmountManwon: bigint('deal_amount_manwon', { mode: 'number' }).notNull(),
    dealingGbn: varchar('dealing_gbn', { length: 50 }),
    buyerGbn: varchar('buyer_gbn', { length: 50 }),
    sellerGbn: varchar('seller_gbn', { length: 50 }),
    estateAgentSggNm: varchar('estate_agent_sgg_nm', { length: 200 }),
    buildYear: integer('build_year'),
    buildingArea: numeric('building_area', { precision: 14, scale: 4 }),
    buildingType: varchar('building_type', { length: 50 }),
    buildingUse: varchar('building_use', { length: 100 }),
    landUse: varchar('land_use', { length: 100 }),
    plottageArea: numeric('plottage_area', { precision: 14, scale: 4 }),
    floor: integer('floor'),
    cdealType: varchar('cdeal_type', { length: 20 }),
    canceledAt: date('canceled_at'),
    isCanceled: boolean('is_canceled').notNull().default(false),
    shareDealingType: varchar('share_dealing_type', { length: 50 }),
    isShareDeal: boolean('is_share_deal').notNull().default(false),
    needsGeocoding: boolean('needs_geocoding').notNull().default(true),
    geocodingStatus: varchar('geocoding_status', { length: 30 }).notNull().default('pending'),
    geocodingProvider: varchar('geocoding_provider', { length: 50 }),
    geocodingUpdatedAt: timestamp('geocoding_updated_at', { withTimezone: true }),
    geocodingErrorMessage: text('geocoding_error_message'),
    lat: numeric('lat', { precision: 10, scale: 7 }),
    lng: numeric('lng', { precision: 10, scale: 7 }),
    location: geometryPoint('location', { srid: 4326 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceRowHashUniqueIndex: uniqueIndex('non_residential_trades_source_row_hash_idx').on(
      table.sourceRowHash,
    ),
    dealDateIndex: index('non_residential_trades_deal_date_idx').on(table.dealDate),
    sourceRequestIndex: index('non_residential_trades_source_request_idx').on(
      table.sourceRequestLawdCd,
      table.sourceRequestYm,
    ),
    sggUmdIndex: index('non_residential_trades_sgg_umd_idx').on(table.sggCd, table.umdNm),
    sggUmdJibunIndex: index('non_residential_trades_sgg_umd_jibun_idx').on(
      table.sggCd,
      table.umdNm,
      table.jibun,
    ),
    geocodingStatusIndex: index('non_residential_trades_geocoding_status_idx').on(
      table.needsGeocoding,
      table.geocodingStatus,
    ),
    filterFlagsIndex: index('non_residential_trades_filter_flags_idx').on(
      table.isCanceled,
      table.isShareDeal,
      table.isJibunMasked,
    ),
  }),
);

export const geocodingCache = pgTable(
  'geocoding_cache',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    query: varchar('query', { length: 300 }).notNull(),
    normalizedQuery: varchar('normalized_query', { length: 300 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('success'),
    lat: numeric('lat', { precision: 10, scale: 7 }),
    lng: numeric('lng', { precision: 10, scale: 7 }),
    location: geometryPoint('location', { srid: 4326 }),
    rawResponse: jsonb('raw_response'),
    errorMessage: text('error_message'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    normalizedQueryUniqueIndex: uniqueIndex('geocoding_cache_normalized_query_idx').on(
      table.normalizedQuery,
    ),
    statusIndex: index('geocoding_cache_status_idx').on(table.status),
  }),
);

export const dbSchema = {
  geocodingCache,
  nonResidentialTrades,
};
