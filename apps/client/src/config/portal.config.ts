/**
 * Active portal (deploy target) — resolved at runtime from build + config.json.
 *
 * Each subdomain is a SEPARATE deployment fixed to ONE portal via `EXPO_PUBLIC_PORTAL`
 * at build time. Runtime config may change API URL but never the portal identity of this build.
 */
import type { AppPortal } from '@/domain/types';

import { BUILD_PORTAL, getRuntimePortal } from './runtimeConfig';

export type { AppPortal };

/** The portal this build was compiled for (immutable). */
export { BUILD_PORTAL as BUILD_TIME_PORTAL };

/** Current active portal for this deployment (always matches build portal). */
export function getActivePortal(): AppPortal {
  return getRuntimePortal();
}

/** Per-portal branding for login + chrome. */
export interface PortalMeta {
  name: string;
  loginSubtitle: string;
  homeHref: string;
  authIcon: 'storefront-outline' | 'shield-checkmark-outline' | 'megaphone-outline';
}

export const PORTAL_META: Record<AppPortal, PortalMeta> = {
  merchant: {
    name: 'پنل فروشنده',
    loginSubtitle: 'برای مدیریت فروشگاه خود وارد شوید.',
    homeHref: '/',
    authIcon: 'storefront-outline',
  },
  admin: {
    name: 'پنل مدیریت',
    loginSubtitle: 'ورود مدیران پلتفرم.',
    homeHref: '/admin',
    authIcon: 'shield-checkmark-outline',
  },
  affiliate: {
    name: 'پنل بازاریاب',
    loginSubtitle: 'ورود بازاریاب‌ها برای معرفی فروشنده و دریافت پورسانت.',
    homeHref: '/affiliate',
    authIcon: 'megaphone-outline',
  },
};

export function getActivePortalMeta(): PortalMeta {
  return PORTAL_META[getActivePortal()];
}

/** @deprecated Use getActivePortal() — kept for gradual migration. */
export const ACTIVE_PORTAL: AppPortal = BUILD_PORTAL;

/** @deprecated Use getActivePortalMeta(). */
export const ACTIVE_PORTAL_META: PortalMeta = PORTAL_META[BUILD_PORTAL];
