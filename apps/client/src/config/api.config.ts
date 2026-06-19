/**
 * Backend API configuration (per deployment).
 *
 * Set `EXPO_PUBLIC_API_BASE_URL` to your backend origin (e.g. https://api.example) to enable
 * real phone-OTP login via the `services/api` backend. When empty (local dev / tests) the app
 * stays on the in-memory mock auth, so nothing external is required to run the UI.
 */
export const API_BASE_URL: string = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

/** Whether a real backend is configured for this deployment. */
export const isApiConfigured: boolean = API_BASE_URL.length > 0;
