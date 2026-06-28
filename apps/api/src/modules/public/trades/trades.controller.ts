import { Controller, Get, Query, Req, UseFilters, UseGuards } from '@nestjs/common';
import {
  apiListSuccess,
  apiSuccess,
  createApiMeta,
  HttpExceptionFilter,
  OriginGuard,
  parseQuery,
  type RequestWithContext,
} from '@app/api';
import { nearbyTradesQuerySchema } from './dto/nearby-trades.query';
import { tradeHistoryQuerySchema } from './dto/trade-history.query';
import { tradeSummariesQuerySchema } from './dto/trade-summaries.query';
import { TradesService } from './trades.service';

@UseFilters(HttpExceptionFilter)
@UseGuards(OriginGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get('summaries')
  async getSummaries(@Req() request: RequestWithContext, @Query() query: Record<string, unknown>) {
    const parsedQuery = parseQuery(tradeSummariesQuerySchema, query);
    const result = await this.tradesService.getTradeSummaries(parsedQuery);

    return apiSuccess(
      result,
      createApiMeta({
        count: result.items.length,
        requestId: request.requestId ?? 'req_unknown',
      }),
    );
  }

  @Get('history')
  async getHistory(@Req() request: RequestWithContext, @Query() query: Record<string, unknown>) {
    const parsedQuery = parseQuery(tradeHistoryQuerySchema, query);
    const result = await this.tradesService.getTradeHistory(parsedQuery);

    return apiSuccess(result, createApiMeta({ requestId: request.requestId ?? 'req_unknown' }));
  }

  @Get('nearby')
  async getNearby(@Req() request: RequestWithContext, @Query() query: Record<string, unknown>) {
    const parsedQuery = parseQuery(nearbyTradesQuerySchema, query);
    const response = await this.tradesService.getNearbyTrades(parsedQuery);

    return apiListSuccess(
      response.result,
      createApiMeta({
        count: response.meta.count,
        hasMore: response.meta.hasMore,
        limit: response.meta.limit,
        requestId: request.requestId ?? 'req_unknown',
      }),
    );
  }
}
