export const APP_NAMES = {
  api: 'api',
  worker: 'worker',
} as const;

export const HEALTH_STATUS = 'ok' as const;

export type AppName = (typeof APP_NAMES)[keyof typeof APP_NAMES];

export * from './vworld-geocoding';
