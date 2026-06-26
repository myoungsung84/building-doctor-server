import { Controller, Get } from '@nestjs/common';

import { APP_NAMES, HEALTH_STATUS } from '@app/domain';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: HEALTH_STATUS,
      app: APP_NAMES.api,
    };
  }
}
