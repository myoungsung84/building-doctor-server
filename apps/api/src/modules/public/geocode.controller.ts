import { Controller, Get, Query, Req, UseFilters, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  createApiMeta,
  HttpExceptionFilter,
  OriginGuard,
  parseQuery,
  type RequestWithContext,
} from '@app/api';
import { GeocodeService } from './geocode.service';
import { geocodeQuerySchema } from './dto/geocode.query';

@UseFilters(HttpExceptionFilter)
@UseGuards(OriginGuard)
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  async geocode(@Req() request: RequestWithContext, @Query() query: Record<string, unknown>) {
    const parsedQuery = parseQuery(geocodeQuerySchema, query);
    const result = await this.geocodeService.geocodeAddress(parsedQuery.q);

    return apiSuccess(result, createApiMeta({ requestId: request.requestId ?? 'req_unknown' }));
  }
}
