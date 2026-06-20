/**
 * Cross-platform session-token storage.
 *
 * Persists the backend-issued session reference (short-lived access JWT + refresh token) so a
 * page refresh / PWA relaunch can restore the session instead of logging the user out. On the
 * web this uses `localStorage` (synchronous, survives reloads); on native (web-first build today)
 * it falls back to an in-memory store so the API stays identical and cross-platform.
 *
 * Security: these are OUR session tokens — a short-lived access JWT and a rotating refresh token
 * issued by `services/api`. They are NEVER WooCommerce keys, WordPress passwords, SMS keys, DB
 * URLs, or any provider credential (those never reach the frontend). Storing a session reference
 * client-side is the standard, viable mechanism for a static SPA that has no httpOnly-cookie
 * backend; the refresh token is rotated on every use and revocable server-side on logout.
 */
import { Platform } from 'react-native';

const ACCESS_KEY = 'jetweb.session.accessToken';
const REFRESH_KEY = 'jetweb.session.refreshToken';

export interface StoredTokens {
  token: string | null;
  refreshToken: string | null;
}

/** The web localStorage if available and accessible (guards Safari private-mode throws). */
function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    // Use `globalThis` (not the `window` browser global) so this stays lint-clean and safe on
    // any JS host; on the web this resolves to the real localStorage.
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (ls) return ls;
  } catch {
    /* access denied (privacy mode / sandboxed iframe) — fall back to memory */
  }
  return null;
}

// Native / no-localStorage fallback (in-memory only; resets on reload, like before).
let memAccess: string | null = null;
let memRefresh: string | null = null;

export function loadTokens(): StoredTokens {
  const ls = webStorage();
  if (ls) {
    try {
      return { token: ls.getItem(ACCESS_KEY), refreshToken: ls.getItem(REFRESH_KEY) };
    } catch {
      /* ignore */
    }
  }
  return { token: memAccess, refreshToken: memRefresh };
}

export function persistTokens(tokens: StoredTokens): void {
  const ls = webStorage();
  if (ls) {
    try {
      if (tokens.token) ls.setItem(ACCESS_KEY, tokens.token);
      else ls.removeItem(ACCESS_KEY);
      if (tokens.refreshToken) ls.setItem(REFRESH_KEY, tokens.refreshToken);
      else ls.removeItem(REFRESH_KEY);
      return;
    } catch {
      /* quota/security error — fall through to memory */
    }
  }
  memAccess = tokens.token;
  memRefresh = tokens.refreshToken;
}

export function clearStoredTokens(): void {
  persistTokens({ token: null, refreshToken: null });
}
