import { Injectable } from '@nestjs/common';

import { ApiException } from '@app/api';
import type { NearbyTradesQuery } from './dto/nearby-trades.query';
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
  markerKey: string;
  sggCd: string;
  sggNm: string;
  tradeCount: number;
  umdNm: string;
};

type NearbySummary = {
  averageDealAmountManwon: number | null;
  averagePricePerPyeongManwon: number | null;
  markerCount: number;
  medianDealAmountManwon: number | null;
  tradeCount: number;
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

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle] ?? null;
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
    const tradeAmounts = rows.map((row) => row.dealAmountManwon);
    const summaryPriceValues = rows
      .map((row) => calculatePricePerPyeongManwon(row.dealAmountManwon, row.buildingAreaSqm))
      .filter((value): value is number => value !== null);

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
      result: {
        items,
        summary: {
          averageDealAmountManwon: averageWhole(tradeAmounts),
          averagePricePerPyeongManwon: average(summaryPriceValues),
          markerCount: sortedMarkers.length,
          medianDealAmountManwon: median(tradeAmounts),
          tradeCount: rows.length,
        } satisfies NearbySummary,
      },
    };
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
