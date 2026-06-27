CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS non_residential_trades (
  id bigserial PRIMARY KEY,
  source varchar(50) NOT NULL DEFAULT 'molit_nrg_trade',
  source_request_lawd_cd varchar(10) NOT NULL,
  source_request_ym varchar(6) NOT NULL,
  source_request_key varchar(100) NOT NULL,
  source_row_hash varchar(64) NOT NULL,
  raw jsonb NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  sgg_cd varchar(10) NOT NULL,
  sgg_nm varchar(100) NOT NULL,
  umd_nm varchar(100) NOT NULL,
  jibun varchar(100),
  is_jibun_masked boolean NOT NULL DEFAULT false,
  geocoding_query varchar(300),
  deal_year integer NOT NULL,
  deal_month integer NOT NULL,
  deal_day integer NOT NULL,
  deal_date date NOT NULL,
  deal_amount_manwon bigint NOT NULL,
  dealing_gbn varchar(50),
  buyer_gbn varchar(50),
  seller_gbn varchar(50),
  estate_agent_sgg_nm varchar(200),
  build_year integer,
  building_area numeric(14, 4),
  building_type varchar(50),
  building_use varchar(100),
  land_use varchar(100),
  plottage_area numeric(14, 4),
  floor integer,
  cdeal_type varchar(20),
  canceled_at date,
  is_canceled boolean NOT NULL DEFAULT false,
  share_dealing_type varchar(50),
  is_share_deal boolean NOT NULL DEFAULT false,
  needs_geocoding boolean NOT NULL DEFAULT true,
  geocoding_status varchar(30) NOT NULL DEFAULT 'pending',
  geocoding_provider varchar(50),
  geocoding_updated_at timestamptz,
  geocoding_error_message text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  location geometry(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT non_residential_trades_source_row_hash_unique UNIQUE (source_row_hash),
  CONSTRAINT non_residential_trades_geocoding_status_check
    CHECK (geocoding_status IN ('pending', 'success', 'failed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS non_residential_trades_deal_date_idx
  ON non_residential_trades (deal_date);

CREATE INDEX IF NOT EXISTS non_residential_trades_source_request_idx
  ON non_residential_trades (source_request_lawd_cd, source_request_ym);

CREATE INDEX IF NOT EXISTS non_residential_trades_sgg_umd_idx
  ON non_residential_trades (sgg_cd, umd_nm);

CREATE INDEX IF NOT EXISTS non_residential_trades_sgg_umd_jibun_idx
  ON non_residential_trades (sgg_cd, umd_nm, jibun);

CREATE INDEX IF NOT EXISTS non_residential_trades_geocoding_status_idx
  ON non_residential_trades (needs_geocoding, geocoding_status);

CREATE INDEX IF NOT EXISTS non_residential_trades_filter_flags_idx
  ON non_residential_trades (is_canceled, is_share_deal, is_jibun_masked);

CREATE INDEX IF NOT EXISTS non_residential_trades_location_gist_idx
  ON non_residential_trades
  USING gist (location);

CREATE TABLE IF NOT EXISTS geocoding_cache (
  id bigserial PRIMARY KEY,
  query varchar(300) NOT NULL,
  normalized_query varchar(300) NOT NULL,
  provider varchar(50) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'success',
  lat numeric(10, 7),
  lng numeric(10, 7),
  location geometry(Point, 4326),
  raw_response jsonb,
  error_message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT geocoding_cache_normalized_query_unique UNIQUE (normalized_query),
  CONSTRAINT geocoding_cache_status_check CHECK (status IN ('success', 'failed'))
);

CREATE INDEX IF NOT EXISTS geocoding_cache_status_idx
  ON geocoding_cache (status);

CREATE INDEX IF NOT EXISTS geocoding_cache_location_gist_idx
  ON geocoding_cache
  USING gist (location);
