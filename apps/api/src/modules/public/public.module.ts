import { Module } from '@nestjs/common';

import { HttpExceptionFilter, OriginGuard } from '@app/api';
import { ConfigModule } from '@app/config';
import { DbModule } from '@app/db';
import { DataStatusController } from './data-status.controller';
import { DataStatusService } from './data-status.service';
import { GeocodeController } from './geocode.controller';
import { GeocodeRepository } from './geocode.repository';
import { GeocodeService } from './geocode.service';
import { TradesController } from './trades.controller';
import { TradesRepository } from './trades.repository';
import { TradesService } from './trades.service';

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
