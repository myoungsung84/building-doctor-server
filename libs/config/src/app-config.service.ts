import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  get port(): number {
    const port = Number(process.env.PORT ?? 4000);

    return Number.isNaN(port) ? 4000 : port;
  }
}
