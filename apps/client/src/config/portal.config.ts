/**
 * Active portal (deploy target).
 *
 * Each subdomain is a SEPARATE deployment of this same codebase, fixed to ONE portal via the
 * build-time env var `EXPO_PUBLIC_PORTAL` (Expo inlines `EXPO_PUBLIC_*` at build time). This is
 * how we ship three standalone apps — merchant / admin / affiliate — each with its own login,
 * its own subdomain, and its own security boundary, while sharing one design system.
 *
 *   EXPO_PUBLIC_PORTAL=merchant   →  app.example       (store owners)
 *   EXPO_PUBLIC_PORTAL=admin      →  admin.example     (platform owner)
 *   EXPO_PUBLIC_PORTAL=affiliate  →  partner.example   (marketers)
 *
 * If unset (local dev / tests) it defaults to `merchant`.
 */
import type { AppPortal } from '@/domain/types';

function resolveActivePortal(): AppPortal {
  const raw = process.env.EXPO_PUBLIC_PORTAL;
  return raw === 'admin' || raw === 'affiliate' ? raw : 'merchant';
}

/** The single portal this deployment serves. */
export const ACTIVE_PORTAL: AppPortal = resolveActivePortal();

/** Per-portal branding for the (shared-theme) login + chrome. */
export interface PortalMeta {
  /** Short product name shown in the top bar / login. */
  name: string;
  /** Login subtitle. */
  loginSubtitle: string;
  /** Home route for this portal. */
  homeHref: string;
  /** Brand icon for the auth screen. */
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

/** Branding for the active deployment's portal. */
export const ACTIVE_PORTAL_META: PortalMeta = PORTAL_META[ACTIVE_PORTAL];
