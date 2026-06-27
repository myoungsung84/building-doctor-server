import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  get allowedOrigins(): string[] {
    const defaults = this.nodeEnv === 'production' ? [] : ['http://localhost:3000'];
    const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    return [...new Set([...defaults, ...configuredOrigins])];
  }

  get port(): number {
    const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

    return Number.isNaN(port) ? 4000 : port;
  }

  get databaseUrl(): string {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }

    return databaseUrl;
  }

  get molitServiceKey(): string {
    const serviceKey = process.env.MOLIT_SERVICE_KEY;

    if (!serviceKey) {
      throw new Error('MOLIT_SERVICE_KEY is required');
    }

    return serviceKey;
  }

  get molitNrgTradeApiBaseUrl(): string {
    return (
      process.env.MOLIT_NRG_TRADE_API_BASE_URL ??
      'https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade'
    );
  }

  get vworldApiKey(): string {
    const apiKey = process.env.VWORLD_API_KEY;

    if (!apiKey) {
      throw new Error('VWORLD_API_KEY is required');
    }

    return apiKey;
  }
}
