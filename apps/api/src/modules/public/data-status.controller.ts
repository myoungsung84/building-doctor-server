import { Controller, Get, Req, UseFilters, UseGuards } from '@nestjs/common';
import {
  apiSuccess,
  createApiMeta,
  HttpExceptionFilter,
  OriginGuard,
  type RequestWithContext,
} from '@app/api';
import { DataStatusService } from './data-status.service';

@UseFilters(HttpExceptionFilter)
@UseGuards(OriginGuard)
@Controller('data-status')
export class DataStatusController {
  constructor(private readonly dataStatusService: DataStatusService) {}

  @Get()
  async getDataStatus(@Req() request: RequestWithContext) {
    const result = await this.dataStatusService.getDataStatus();

    return apiSuccess(result, createApiMeta({ requestId: request.requestId ?? 'req_unknown' }));
  }
}
