import type { PoolClient } from 'pg';

import { AppLoggerService } from '@app/logger';
import { MolitNrgTradeClient } from '../clients/molit-nrg-trade.client';
import {
  normalizeMolitTradeItem,
  parseMolitNrgTradeResponse,
} from '../parsers/molit-nrg-trade.parser';
import { NonResidentialTradesRepository } from '../repositories/non-residential-trades.repository';

export type SyncNrgTradesJobOptions = {
  dealYmds: string[];
  lawdCd: string;
};

export type SyncNrgTradesMonthSummary = {
  dealYmd: string;
  fetchedItems: number;
  inserted: number;
  pages: number;
  skipped: number;
  updated: number;
};

export type SyncNrgTradesJobSummary = {
  fetchedItems: number;
  inserted: number;
  months: SyncNrgTradesMonthSummary[];
  skipped: number;
  updated: number;
};

export class SyncNrgTradesJob {
  private readonly repository: NonResidentialTradesRepository;

  constructor(
    private readonly client: PoolClient,
    private readonly logger: AppLoggerService,
    private readonly molitClient: MolitNrgTradeClient,
  ) {
    this.repository = new NonResidentialTradesRepository(client);
  }

  async run(options: SyncNrgTradesJobOptions): Promise<SyncNrgTradesJobSummary> {
    const months: SyncNrgTradesMonthSummary[] = [];

    for (const dealYmd of options.dealYmds) {
      months.push(await this.syncMonth(options.lawdCd, dealYmd));
    }

    return {
      fetchedItems: months.reduce((sum, month) => sum + month.fetchedItems, 0),
      inserted: months.reduce((sum, month) => sum + month.inserted, 0),
      months,
      skipped: months.reduce((sum, month) => sum + month.skipped, 0),
      updated: months.reduce((sum, month) => sum + month.updated, 0),
    };
  }

  private async syncMonth(lawdCd: string, dealYmd: string): Promise<SyncNrgTradesMonthSummary> {
    const context = 'SyncNrgTradesJob';
    const pageSize = 100;
    let currentPage = 1;
    let totalPages = 1;
    let fetchedItems = 0;
    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    this.logger.log(`sync start: lawdCd=${lawdCd}, dealYmd=${dealYmd}`, context);

    while (currentPage <= totalPages) {
      const xml = await this.molitClient.fetchPage({
        dealYmd,
        lawdCd,
        numOfRows: pageSize,
        pageNo: currentPage,
      });
      const parsed = parseMolitNrgTradeResponse(xml);
      const resultCode = parsed.resultCode?.trim();

      if (resultCode !== '000') {
        throw new Error(
          `MOLIT API error (${parsed.resultCode ?? 'unknown'}): ${parsed.resultMsg ?? 'unknown'}`,
        );
      }

      totalPages = Math.max(1, Math.ceil(parsed.totalCount / pageSize));
      fetchedItems += parsed.items.length;

      for (const item of parsed.items) {
        try {
          const normalized = normalizeMolitTradeItem({
            dealYmd,
            lawdCd,
            rawItem: item,
          });
          const result = await this.repository.upsertTrade(normalized);

          if (result.inserted) {
            inserted += 1;
          } else {
            updated += 1;
          }
        } catch (error) {
          skipped += 1;
          const message = error instanceof Error ? error.message : 'unknown error';
          this.logger.warn(
            `skip invalid item: lawdCd=${lawdCd}, dealYmd=${dealYmd}, page=${currentPage}, reason=${message}`,
            context,
          );
        }
      }

      currentPage += 1;
    }

    this.logger.log(
      `sync done: lawdCd=${lawdCd}, dealYmd=${dealYmd}, pages=${totalPages}, fetched=${fetchedItems}, inserted=${inserted}, updated=${updated}, skipped=${skipped}`,
      context,
    );

    return {
      dealYmd,
      fetchedItems,
      inserted,
      pages: totalPages,
      skipped,
      updated,
    };
  }
}
