import { Injectable } from '@nestjs/common';

import { ApiException } from '@app/api';
import type { NearbyDisplayMode, NearbyTradesQuery } from './dto/nearby-trades.query';
import type { TradeHistoryQuery } from './dto/trade-history.query';
import { TradesRepository, type NearbyTradeRow } from './trades.repository';
import {
  buildMarkerKey,
  calculateBuildingAreaPyeong,
  calculatePricePerPyeongManwon,
  endOfYearMonth,
  roundTo,
  startOfYearMonth,
} from '../shared/public.utils';

type NearbyMarkerItem = {
  addressLabel: string;
  averageDealAmountManwon: number | null;
  averagePricePerPyeongManwon: number | null;
  buildingUses: string[];
  distanceMeters: number;
  hasShareDeal: boolean;
  jibun: string;
  lat: number;
  latestDealAmountManwon: number;
  latestDealDate: string;
  lng: number;
  medianDealAmountManwon: number | null;
  medianPricePerPyeongManwon: number | null;
  markerKey: string;
  sggCd: string;
  sggNm: string;
  tradeCount: number;
  umdNm: string;
};

type NearbySummary = {
  averageDealAmountManwon: number | null;
  averagePricePerPyeongManwon: number | null;
  geocodedCount: number;
  latestDealDate: string | null;
  markerCount: number;
  medianDealAmountManwon: number | null;
  medianPricePerPyeongManwon: number | null;
  totalCount: number;
  tradeCount: number;
  uniqueAddressCount: number;
};

type NearbyMapItem = {
  averageDealAmountManwon: number | null;
  averagePricePerPyeongManwon: number | null;
  count: number;
  id: string;
  label: string;
  lat: number;
  latestDealDate: string | null;
  lng: number;
  medianDealAmountManwon: number | null;
  medianPricePerPyeongManwon: number | null;
  sggNm: string | null;
  type: 'cluster' | 'district' | 'dong' | 'parcel';
  umdNm: string | null;
};

type NearbyMarkerMeta = {
  displayMode: NearbyDisplayMode;
  limited: boolean;
  returnedCount: number;
  totalCandidates: number;
};

type DealAmountTrendItem = {
  dealAmountManwon: number;
  dealDate: string;
  pricePerPyeongManwon: number | null;
};

type HistoryItem = {
  buildingAreaPyeong: number | null;
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
  pricePerPyeongManwon: number | null;
  sellerGbn: string | null;
};

type YearlyAveragePricePerPyeongItem = {
  averagePricePerPyeongManwon: number;
  tradeCount: number;
  year: number;
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return roundTo(values.reduce((sum, value) => sum + value, 0) / values.length, 2);
}

function averageWhole(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

function medianNumber(values: number[], digits = 0): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return roundTo((sorted[middle - 1] + sorted[middle]) / 2, digits);
  }

  const value = sorted[middle];

  return value === undefined ? null : roundTo(value, digits);
}

function resolvePeriodWindow(query: NearbyTradesQuery, defaultFromYm: string, defaultToYm: string) {
  const fromYm = query.from ?? defaultFromYm;
  const toYm = query.to ?? defaultToYm;

  return {
    fromYm,
    toYm,
    fromDate: startOfYearMonth(fromYm),
    toDate: endOfYearMonth(toYm),
  };
}

function sortByDealDateAscending<T extends { dealDate: string; id?: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    if (left.dealDate === right.dealDate) {
      return (left.id ?? 0) - (right.id ?? 0);
    }

    return left.dealDate.localeCompare(right.dealDate);
  });
}

function sortByDealDateDescending<T extends { dealDate: string; id?: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    if (left.dealDate === right.dealDate) {
      return (right.id ?? 0) - (left.id ?? 0);
    }

    return right.dealDate.localeCompare(left.dealDate);
  });
}

const DISPLAY_MODE_LIMITS: Record<NearbyDisplayMode, number> = {
  'block-cluster': 200,
  'district-summary': 50,
  'dong-summary': 100,
  'parcel-detail': 300,
};

function resolveDisplayMode(query: NearbyTradesQuery): NearbyDisplayMode {
  if (query.displayMode) {
    return query.displayMode;
  }

  if (query.radiusMeters <= 500) {
    return 'parcel-detail';
  }

  if (query.radiusMeters <= 1000) {
    return 'block-cluster';
  }

  if (query.radiusMeters <= 2000) {
    return 'dong-summary';
  }

  return 'district-summary';
}

function resolveMapItemsLimit(displayMode: NearbyDisplayMode, requestedLimit: number): number {
  return Math.min(requestedLimit, DISPLAY_MODE_LIMITS[displayMode]);
}

function buildUniqueAddressKey(row: NearbyTradeRow): string {
  return `${row.sggNm}:${row.umdNm}:${row.jibun}`;
}

function extractLatestDealMonth(rows: Array<{ dealDate: string }>): string | null {
  if (rows.length === 0) {
    return null;
  }

  const latestDealDate = rows.reduce(
    (latest, row) => (row.dealDate > latest ? row.dealDate : latest),
    rows[0]?.dealDate ?? '',
  );

  return latestDealDate ? latestDealDate.slice(0, 7) : null;
}

function calculatePricePerPyeongValues(rows: NearbyTradeRow[]): number[] {
  return rows
    .map((row) => calculatePricePerPyeongManwon(row.dealAmountManwon, row.buildingAreaSqm))
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);
}

function buildMapStats(rows: NearbyTradeRow[]) {
  const dealAmounts = rows.map((row) => row.dealAmountManwon);
  const pricePerPyeongValues = calculatePricePerPyeongValues(rows);

  return {
    averageDealAmountManwon: averageWhole(dealAmounts),
    averagePricePerPyeongManwon: average(pricePerPyeongValues),
    latestDealDate: extractLatestDealMonth(rows),
    medianDealAmountManwon: medianNumber(dealAmounts),
    medianPricePerPyeongManwon: medianNumber(pricePerPyeongValues, 2),
  };
}

function calculateCentroid(rows: NearbyTradeRow[]) {
  const lat = rows.reduce((sum, row) => sum + row.lat, 0) / rows.length;
  const lng = rows.reduce((sum, row) => sum + row.lng, 0) / rows.length;

  return {
    lat: roundTo(lat, 6),
    lng: roundTo(lng, 6),
  };
}

function sortMapItems(items: NearbyMapItem[]): NearbyMapItem[] {
  return [...items].sort((left, right) => {
    if (left.count === right.count) {
      return (right.latestDealDate ?? '').localeCompare(left.latestDealDate ?? '');
    }

    return right.count - left.count;
  });
}

@Injectable()
export class TradesService {
  constructor(private readonly tradesRepository: TradesRepository) {}

  async getDataStatus() {
    const status = await this.tradesRepository.findDataStatus();

    return {
      area: {
        lawdCd: status.lawdCd,
        name: status.sggNm ? `서울특별시 ${status.sggNm}` : null,
      },
      counts: {
        failed: status.failed,
        geocoded: status.geocoded,
        masked: status.masked,
        total: status.total,
      },
      notices: [
        '지번이 마스킹된 거래는 지도 마커에서 제외됩니다.',
        '해제 거래는 기본 지도 조회에서 제외됩니다.',
        '지도 마커와 히스토리는 동일 지번 기준이며 동일 호실 또는 동일 건물 단위를 보장하지 않습니다.',
        '평당가는 건물면적 기준으로 계산되며 실제 전용면적/토지지분 기준 가격과 다를 수 있습니다.',
      ],
      period: {
        from: status.fromYm,
        to: status.toYm,
      },
      source: '국토교통부 비주거용 부동산 매매 실거래가',
    };
  }

  async getNearbyTrades(query: NearbyTradesQuery) {
    const bounds = await this.tradesRepository.findPeriodBounds();

    if (!bounds.fromYm || !bounds.toYm) {
      throw ApiException.notFound('조회 가능한 거래 데이터가 없습니다.');
    }

    const period = resolvePeriodWindow(query, bounds.fromYm, bounds.toYm);
    const rows = await this.tradesRepository.findNearbyTradeRows({
      buildingUse: query.buildingUse,
      centerLat: query.lat,
      centerLng: query.lng,
      excludeShareDeals: query.excludeShareDeals,
      fromDate: period.fromDate,
      includeCanceled: query.includeCanceled,
      radiusMeters: query.radiusMeters,
      toDate: period.toDate,
    });
    const resolvedDisplayMode = resolveDisplayMode(query);

    const grouped = new Map<string, NearbyTradeRow[]>();

    for (const row of rows) {
      const markerKey = buildMarkerKey(row.sggCd, row.umdNm, row.jibun);
      const current = grouped.get(markerKey) ?? [];
      current.push(row);
      grouped.set(markerKey, current);
    }

    const allMarkers = [...grouped.entries()].map(([markerKey, markerRows]) => {
      const latestRows = sortByDealDateDescending(markerRows);
      const displayRow =
        [...markerRows].sort((left, right) => left.id - right.id)[0] ?? latestRows[0];
      const latestRow = latestRows[0];
      const buildingUses = [
        ...new Set(
          markerRows
            .map((row) => row.buildingUse)
            .filter((value): value is string => typeof value === 'string' && value.trim() !== ''),
        ),
      ].sort();
      const dealAmounts = markerRows.map((row) => row.dealAmountManwon);
      const pricePerPyeongValues = markerRows
        .map((row) => calculatePricePerPyeongManwon(row.dealAmountManwon, row.buildingAreaSqm))
        .filter((value): value is number => value !== null);

      return {
        addressLabel: `${displayRow.sggNm} ${displayRow.umdNm} ${displayRow.jibun}`,
        averageDealAmountManwon: averageWhole(dealAmounts),
        averagePricePerPyeongManwon: average(pricePerPyeongValues),
        buildingUses,
        distanceMeters: Math.round(displayRow.distanceMeters),
        hasShareDeal: markerRows.some((row) => row.isShareDeal),
        jibun: displayRow.jibun,
        lat: displayRow.lat,
        latestDealAmountManwon: latestRow.dealAmountManwon,
        latestDealDate: latestRow.dealDate,
        lng: displayRow.lng,
        medianDealAmountManwon: medianNumber(dealAmounts),
        medianPricePerPyeongManwon: medianNumber(pricePerPyeongValues, 2),
        markerKey,
        sggCd: displayRow.sggCd,
        sggNm: displayRow.sggNm,
        tradeCount: markerRows.length,
        umdNm: displayRow.umdNm,
      } satisfies NearbyMarkerItem;
    });

    const sortedMarkers = allMarkers.sort((left, right) => {
      if (left.distanceMeters === right.distanceMeters) {
        return right.latestDealDate.localeCompare(left.latestDealDate);
      }

      return left.distanceMeters - right.distanceMeters;
    });
    const hasMore = sortedMarkers.length > query.limit;
    const items = sortedMarkers.slice(0, query.limit);
    const mapItemsLimit = resolveMapItemsLimit(resolvedDisplayMode, query.limit);
    const allMapItems = this.buildNearbyMapItems(resolvedDisplayMode, rows, sortedMarkers);
    const limitedMapItems = allMapItems.slice(0, mapItemsLimit);
    const summaryStats = buildMapStats(rows);
    const uniqueAddressCount = new Set(rows.map((row) => buildUniqueAddressKey(row))).size;

    return {
      center: {
        lat: query.lat,
        lng: query.lng,
      },
      meta: {
        count: items.length,
        hasMore,
        limit: query.limit,
      },
      radiusMeters: query.radiusMeters,
      radiusM: query.radiusMeters,
      result: {
        items,
        displayMode: resolvedDisplayMode,
        mapItems: limitedMapItems,
        markerMeta: {
          displayMode: resolvedDisplayMode,
          limited: allMapItems.length > mapItemsLimit,
          returnedCount: limitedMapItems.length,
          totalCandidates: rows.length,
        } satisfies NearbyMarkerMeta,
        summary: {
          averageDealAmountManwon: summaryStats.averageDealAmountManwon,
          averagePricePerPyeongManwon: summaryStats.averagePricePerPyeongManwon,
          geocodedCount: rows.length,
          latestDealDate: summaryStats.latestDealDate,
          markerCount: sortedMarkers.length,
          medianDealAmountManwon: summaryStats.medianDealAmountManwon,
          medianPricePerPyeongManwon: summaryStats.medianPricePerPyeongManwon,
          totalCount: rows.length,
          tradeCount: rows.length,
          uniqueAddressCount,
        } satisfies NearbySummary,
      },
    };
  }

  private buildNearbyMapItems(
    displayMode: NearbyDisplayMode,
    rows: NearbyTradeRow[],
    parcelMarkers: NearbyMarkerItem[],
  ): NearbyMapItem[] {
    switch (displayMode) {
      case 'parcel-detail':
        return parcelMarkers.map((item) => ({
          averageDealAmountManwon: item.averageDealAmountManwon,
          averagePricePerPyeongManwon: item.averagePricePerPyeongManwon,
          count: item.tradeCount,
          id: `parcel:${item.markerKey}`,
          label: item.addressLabel,
          lat: item.lat,
          latestDealDate: item.latestDealDate.slice(0, 7),
          lng: item.lng,
          medianDealAmountManwon: item.medianDealAmountManwon ?? null,
          medianPricePerPyeongManwon: item.medianPricePerPyeongManwon ?? null,
          sggNm: item.sggNm,
          type: 'parcel',
          umdNm: item.umdNm,
        }));
      case 'block-cluster':
        return this.buildClusterMapItems(rows);
      case 'dong-summary':
        return this.buildGroupedSummaryMapItems(rows, 'dong-summary');
      case 'district-summary':
        return this.buildGroupedSummaryMapItems(rows, 'district-summary');
    }
  }

  private buildClusterMapItems(rows: NearbyTradeRow[]): NearbyMapItem[] {
    const gridSize = 0.002;
    const grouped = new Map<string, NearbyTradeRow[]>();

    for (const row of rows) {
      const gridLat = Math.round(row.lat / gridSize);
      const gridLng = Math.round(row.lng / gridSize);
      const groupKey = `${gridLat}:${gridLng}`;
      const current = grouped.get(groupKey) ?? [];

      current.push(row);
      grouped.set(groupKey, current);
    }

    return sortMapItems(
      [...grouped.entries()].map(([groupKey, groupRows]) => {
        const stats = buildMapStats(groupRows);
        const centroid = calculateCentroid(groupRows);
        const distinctDongCount = new Set(groupRows.map((row) => row.umdNm)).size;
        const label =
          distinctDongCount === 1 ? `${groupRows[0]?.umdNm ?? '근처'} 근처 거래` : '근처 거래 묶음';

        return {
          averageDealAmountManwon: stats.averageDealAmountManwon,
          averagePricePerPyeongManwon: stats.averagePricePerPyeongManwon,
          count: groupRows.length,
          id: `cluster:${groupKey}`,
          label,
          lat: centroid.lat,
          latestDealDate: stats.latestDealDate,
          lng: centroid.lng,
          medianDealAmountManwon: stats.medianDealAmountManwon,
          medianPricePerPyeongManwon: stats.medianPricePerPyeongManwon,
          sggNm: distinctDongCount === 1 ? (groupRows[0]?.sggNm ?? null) : null,
          type: 'cluster',
          umdNm: distinctDongCount === 1 ? (groupRows[0]?.umdNm ?? null) : null,
        } satisfies NearbyMapItem;
      }),
    );
  }

  private buildGroupedSummaryMapItems(
    rows: NearbyTradeRow[],
    displayMode: Extract<NearbyDisplayMode, 'district-summary' | 'dong-summary'>,
  ): NearbyMapItem[] {
    const grouped = new Map<string, NearbyTradeRow[]>();

    for (const row of rows) {
      const groupKey = displayMode === 'district-summary' ? row.sggNm : `${row.sggNm}:${row.umdNm}`;
      const current = grouped.get(groupKey) ?? [];

      current.push(row);
      grouped.set(groupKey, current);
    }

    return sortMapItems(
      [...grouped.entries()].map(([groupKey, groupRows]) => {
        const stats = buildMapStats(groupRows);
        const centroid = calculateCentroid(groupRows);
        const firstRow = groupRows[0];

        if (!firstRow) {
          throw new Error(`grouped nearby rows missing for ${groupKey}`);
        }

        return {
          averageDealAmountManwon: stats.averageDealAmountManwon,
          averagePricePerPyeongManwon: stats.averagePricePerPyeongManwon,
          count: groupRows.length,
          id:
            displayMode === 'district-summary'
              ? `district:${firstRow.sggNm}`
              : `dong:${firstRow.sggNm}:${firstRow.umdNm}`,
          label: displayMode === 'district-summary' ? `반경 내 ${firstRow.sggNm}` : firstRow.umdNm,
          lat: centroid.lat,
          latestDealDate: stats.latestDealDate,
          lng: centroid.lng,
          medianDealAmountManwon: stats.medianDealAmountManwon,
          medianPricePerPyeongManwon: stats.medianPricePerPyeongManwon,
          sggNm: firstRow.sggNm,
          type: displayMode === 'district-summary' ? 'district' : 'dong',
          umdNm: displayMode === 'district-summary' ? null : firstRow.umdNm,
        } satisfies NearbyMapItem;
      }),
    );
  }

  async getTradeHistory(query: TradeHistoryQuery) {
    const rows = await this.tradesRepository.findTradeHistoryRows(query);

    if (rows.length === 0) {
      throw ApiException.notFound('해당 지번의 거래 내역을 찾을 수 없습니다.');
    }

    const latestRow = rows[0];
    const ascendingRows = sortByDealDateAscending(rows);
    const descendingRows = sortByDealDateDescending(rows);
    const historyItems: HistoryItem[] = descendingRows.map((row) => ({
      buildingAreaPyeong: calculateBuildingAreaPyeong(row.buildingAreaSqm),
      buildingAreaSqm: row.buildingAreaSqm,
      buildingType: row.buildingType,
      buildingUse: row.buildingUse,
      buyerGbn: row.buyerGbn,
      dealAmountManwon: row.dealAmountManwon,
      dealDate: row.dealDate,
      dealingGbn: row.dealingGbn,
      floor: row.floor,
      id: row.id,
      isCanceled: row.isCanceled,
      isShareDeal: row.isShareDeal,
      pricePerPyeongManwon: calculatePricePerPyeongManwon(
        row.dealAmountManwon,
        row.buildingAreaSqm,
      ),
      sellerGbn: row.sellerGbn,
    }));
    const validPriceRows = ascendingRows
      .map((row) => ({
        dealDate: row.dealDate,
        pricePerPyeongManwon: calculatePricePerPyeongManwon(
          row.dealAmountManwon,
          row.buildingAreaSqm,
        ),
      }))
      .filter(
        (row): row is { dealDate: string; pricePerPyeongManwon: number } =>
          row.pricePerPyeongManwon !== null,
      );
    const firstValidPriceRow = validPriceRows[0];
    const latestValidPriceRow = validPriceRows.at(-1);
    let growthAnalysisAvailable = false;
    let growthAnalysisReason: string | null =
      '상승률 계산에는 최소 2건 이상의 유효 평당가 거래가 필요합니다.';
    let totalGrowthRatePercent: number | null = null;
    let annualizedGrowthRatePercent: number | null = null;

    if (firstValidPriceRow && latestValidPriceRow && validPriceRows.length >= 2) {
      const elapsedDays = daysBetween(firstValidPriceRow.dealDate, latestValidPriceRow.dealDate);

      if (elapsedDays >= 30) {
        const firstPrice = firstValidPriceRow.pricePerPyeongManwon;
        const latestPrice = latestValidPriceRow.pricePerPyeongManwon;

        if (firstPrice > 0 && latestPrice > 0) {
          const years = elapsedDays / 365.25;
          growthAnalysisAvailable = true;
          growthAnalysisReason = null;
          totalGrowthRatePercent = roundTo((latestPrice / firstPrice - 1) * 100, 2);
          annualizedGrowthRatePercent = roundTo(
            ((latestPrice / firstPrice) ** (1 / years) - 1) * 100,
            2,
          );
        }
      } else {
        growthAnalysisReason = '상승률 계산에는 최소 30일 이상의 시계열 간격이 필요합니다.';
      }
    }

    const yearlyMap = new Map<number, number[]>();

    for (const item of historyItems) {
      if (item.pricePerPyeongManwon === null) {
        continue;
      }

      const year = Number(item.dealDate.slice(0, 4));
      const current = yearlyMap.get(year) ?? [];
      current.push(item.pricePerPyeongManwon);
      yearlyMap.set(year, current);
    }

    const yearlyAveragePricePerPyeong = [...yearlyMap.entries()]
      .sort(([left], [right]) => left - right)
      .map(([year, values]) => ({
        averagePricePerPyeongManwon: average(values) ?? 0,
        tradeCount: values.length,
        year,
      })) satisfies YearlyAveragePricePerPyeongItem[];

    const dealAmountTrend = sortByDealDateAscending(historyItems).map((item) => ({
      dealAmountManwon: item.dealAmountManwon,
      dealDate: item.dealDate,
      pricePerPyeongManwon: item.pricePerPyeongManwon,
    })) satisfies DealAmountTrendItem[];

    return {
      address: {
        jibun: latestRow.jibun,
        label: `서울특별시 ${latestRow.sggNm} ${latestRow.umdNm} ${latestRow.jibun}`,
        lat: latestRow.lat,
        lng: latestRow.lng,
        markerKey: buildMarkerKey(latestRow.sggCd, latestRow.umdNm, latestRow.jibun),
        sggCd: latestRow.sggCd,
        sggNm: latestRow.sggNm,
        umdNm: latestRow.umdNm,
      },
      items: historyItems,
      notice:
        '동일 지번 기준 거래 내역입니다. 동일 호실 또는 동일 건물 단위 거래를 의미하지 않을 수 있습니다.',
      series: {
        dealAmountTrend,
        yearlyAveragePricePerPyeong,
      },
      summary: {
        annualizedGrowthRatePercent,
        averageDealAmountManwon: averageWhole(historyItems.map((item) => item.dealAmountManwon)),
        averagePricePerPyeongManwon: average(
          historyItems
            .map((item) => item.pricePerPyeongManwon)
            .filter((value): value is number => value !== null),
        ),
        firstDealDate: ascendingRows[0]?.dealDate ?? null,
        growthAnalysisAvailable,
        growthAnalysisReason,
        hasShareDeal: historyItems.some((item) => item.isShareDeal),
        latestDealDate: descendingRows[0]?.dealDate ?? null,
        latestPricePerPyeongManwon: historyItems[0]?.pricePerPyeongManwon ?? null,
        totalGrowthRatePercent,
        tradeCount: historyItems.length,
      },
    };
  }
}
