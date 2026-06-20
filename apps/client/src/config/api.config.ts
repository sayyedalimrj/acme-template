/**
 * Backend API configuration.
 *
 * Prefers runtime `/config.json` (see `runtimeConfig.ts`) over build-time env vars.
 */
export {
  getApiBaseUrl,
  isApiConfigured,
  loadRuntimeConfig,
  getRuntimeConfig,
  getRuntimePortal,
  resetRuntimeConfigForTests,
} from './runtimeConfig';
