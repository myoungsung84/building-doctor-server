import { Injectable } from '@nestjs/common';

import { TradesService } from './trades.service';

@Injectable()
export class DataStatusService {
  constructor(private readonly tradesService: TradesService) {}

  async getDataStatus() {
    return this.tradesService.getDataStatus();
  }
}
