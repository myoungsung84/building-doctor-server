import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { RequestContextMiddleware } from '@app/api';
import { ConfigModule } from '@app/config';
import { DbModule } from '@app/db';
import { LoggerModule } from '@app/logger';
import { PublicModule } from './public/public.module';
import { HealthController } from '../routes/health.controller';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    LoggerModule,
    ThrottlerModule.forRoot([
      {
        limit: 120,
        ttl: 60_000,
      },
    ]),
    PublicModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes({ method: RequestMethod.ALL, path: '*path' });
  }
}
