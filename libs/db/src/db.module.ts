import { Module } from '@nestjs/common';

import { DbPlaceholderService } from './db-placeholder.service';

@Module({
  providers: [DbPlaceholderService],
  exports: [DbPlaceholderService],
})
export class DbModule {}
