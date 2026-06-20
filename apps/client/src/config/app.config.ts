/**
 * Application configuration.
 *
 * Data source is resolved at runtime from `/config.json` when available. When no API base URL
 * is configured the app runs on in-memory mock data.
 */
import { getApiBaseUrl, isApiConfigured } from './api.config';

export type DataSource = 'mock' | 'http';

export interface AppConfig {
  readonly dataSource: DataSource;
  readonly apiBaseUrl: string;
  readonly defaultLocale: string;
  readonly defaultDirection: 'ltr' | 'rtl';
  readonly appName: string;
  readonly appVersion: string;
}

/** Live config snapshot (re-read after runtime config loads). */
export function getAppConfig(): AppConfig {
  return {
    dataSource: isApiConfigured() ? 'http' : 'mock',
    apiBaseUrl: getApiBaseUrl(),
    defaultLocale: 'fa',
    defaultDirection: 'rtl',
    appName: 'Store Manager',
    appVersion: '0.1.0',
  };
}

/** @deprecated Use getAppConfig() for runtime values. */
export const appConfig: AppConfig = getAppConfig();
