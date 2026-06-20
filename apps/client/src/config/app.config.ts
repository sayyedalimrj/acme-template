/**
 * Application configuration.
 *
 * The data layer is driven by `dataSource`. For the MVP this is always `'mock'`:
 * the app runs entirely on in-memory, realistic WooCommerce-like data behind adapter
 * interfaces. A future `'http'` source will talk to OUR backend/proxy (never directly to
 * a store, and never holding store credentials in the frontend — see security steering).
 *
 * No secrets, keys, or credentials are ever stored in this file or in the frontend bundle.
 */
import { API_BASE_URL, isApiConfigured } from './api.config';

export type DataSource = 'mock' | 'http';

export interface AppConfig {
  /** Selected data source. MVP: 'mock'. */
  readonly dataSource: DataSource;
  /** Base URL for the future backend/proxy. Empty in the MVP (mock only). */
  readonly apiBaseUrl: string;
  /** Default UI locale (full i18n wiring arrives in a later task). */
  readonly defaultLocale: string;
  /** Default layout direction. */
  readonly defaultDirection: 'ltr' | 'rtl';
  /** Human-readable app name. */
  readonly appName: string;
  /** Static app version (display only). */
  readonly appVersion: string;
}

export const appConfig: AppConfig = {
  // Use the real backend when EXPO_PUBLIC_API_BASE_URL is set; otherwise stay on mock data.
  dataSource: isApiConfigured ? 'http' : 'mock',
  apiBaseUrl: API_BASE_URL,
  defaultLocale: 'fa',
  defaultDirection: 'rtl',
  appName: 'Store Manager',
  appVersion: '0.1.0',
};
