import { Module } from '@nestjs/common';

import { HttpExceptionFilter, OriginGuard } from '@app/api';
import { ConfigModule } from '@app/config';
import { DbModule } from '@app/db';
import { DataStatusController } from './data-status/data-status.controller';
import { DataStatusService } from './data-status/data-status.service';
import { GeocodeController } from './geocode/geocode.controller';
import { GeocodeRepository } from './geocode/geocode.repository';
import { GeocodeService } from './geocode/geocode.service';
import { TradesController } from './trades/trades.controller';
import { TradesRepository } from './trades/trades.repository';
import { TradesService } from './trades/trades.service';

@Module({
  imports: [ConfigModule, DbModule],
  controllers: [GeocodeController, TradesController, DataStatusController],
  providers: [
    DataStatusService,
    GeocodeRepository,
    GeocodeService,
    HttpExceptionFilter,
    OriginGuard,
    TradesRepository,
    TradesService,
  ],
})
export class PublicModule {}
