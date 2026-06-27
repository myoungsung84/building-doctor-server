import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { DbService } from '@app/db';
import { APP_NAMES, HEALTH_STATUS } from '@app/domain';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly dbService: DbService) {}

  @Get()
  getHealth() {
    return {
      status: HEALTH_STATUS,
      app: APP_NAMES.api,
    };
  }

  @Get('db')
  async getDatabaseHealth() {
    try {
      return await this.dbService.healthCheck();
    } catch {
      throw new ServiceUnavailableException('Database health check failed');
    }
  }
}
