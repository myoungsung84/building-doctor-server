import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService {
  log(message: string, context?: string): void {
    const logger = context ? new Logger(context) : new Logger(AppLoggerService.name);

    logger.log(message);
  }

  error(message: string, trace?: string, context?: string): void {
    const logger = context ? new Logger(context) : new Logger(AppLoggerService.name);

    logger.error(message, trace);
  }
}
