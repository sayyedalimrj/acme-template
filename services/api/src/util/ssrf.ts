/**
 * SSRF protection for outbound requests to merchant store URLs.
 *
 * Rejects localhost, loopback, private/link-local/metadata IPs, non-http(s) schemes, embedded
 * credentials, and redirect chains that land on blocked targets. Used before WooCommerce fetches
 * and when merchants register a store URL.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { badRequest } from './errors';

const MAX_REDIRECTS = 3;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  'kubernetes.default.svc',
]);

/** Returns true when an IP must not be used as a WooCommerce fetch target. */
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateOrReservedIpv4(ip);
  if (version === 6) return isPrivateOrReservedIpv6(ip);
  return true;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe80')) return true;
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length);
    if (isIP(mapped) === 4) return isPrivateOrReservedIpv4(mapped);
  }
  return false;
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, '');
}

function isBlockedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host === 'metadata' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host.endsWith('.internal') || host.endsWith('.svc') || host.endsWith('.cluster.local')) {
    return true;
  }
  return false;
}

/** Validate a URL string before any outbound WooCommerce request or site registration. */
export async function assertSafeOutboundUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw badRequest('آدرس فروشگاه نامعتبر است.', 'unsafe_store_url');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw badRequest('فقط آدرس http/https مجاز است.', 'unsafe_store_url');
  }

  if (parsed.username || parsed.password) {
    throw badRequest('آدرس فروشگاه نمی‌تواند حاوی نام کاربری باشد.', 'unsafe_store_url');
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (isBlockedHostname(hostname)) {
    throw badRequest('آدرس فروشگاه مجاز نیست.', 'unsafe_store_url');
  }

  const literalIp = isIP(hostname);
  if (literalIp) {
    if (isBlockedIp(hostname)) {
      throw badRequest('آدرس فروشگاه مجاز نیست.', 'unsafe_store_url');
    }
    return parsed;
  }

  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length) {
    throw badRequest('دامنه فروشگاه قابل resolve نیست.', 'unsafe_store_url');
  }
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw badRequest('آدرس فروشگاه به مقصد داخلی اشاره می‌کند.', 'unsafe_store_url');
    }
  }

  return parsed;
}

/** Normalize merchant input (prepend https, trim slash) then SSRF-check. */
export async function normalizeAndValidateStoreUrl(url: string): Promise<string> {
  let u = url.trim();
  if (!u) throw badRequest('آدرس فروشگاه الزامی است.', 'validation_error');

  const explicitScheme = u.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (explicitScheme && !/^https?$/i.test(explicitScheme[1])) {
    throw badRequest('فقط آدرس http/https مجاز است.', 'unsafe_store_url');
  }

  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  u = u.replace(/\/+$/, '');
  await assertSafeOutboundUrl(u);
  return u;
}

export interface SafeFetchInit extends RequestInit {
  timeoutMs?: number;
}

/**
 * fetch() with manual redirect handling so every hop is SSRF-checked.
 * Node's default redirect follower would bypass our guard.
 */
export async function safeFetch(initialUrl: string, init: SafeFetchInit = {}): Promise<Response> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertSafeOutboundUrl(currentUrl);

    const controller = new AbortController();
    const timeoutMs = init.timeoutMs ?? 10_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    if (init.signal) {
      if (init.signal.aborted) controller.abort();
      else init.signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      const res = await fetch(currentUrl, {
        ...init,
        redirect: 'manual',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (init.signal) init.signal.removeEventListener('abort', onAbort);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          throw badRequest('ریدایرکت نامعتبر از فروشگاه.', 'unsafe_redirect');
        }
        if (hop >= MAX_REDIRECTS) {
          throw badRequest('تعداد ریدایرکت بیش از حد مجاز است.', 'unsafe_redirect');
        }
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      if (init.signal) init.signal.removeEventListener('abort', onAbort);
      throw err;
    }
  }

  throw badRequest('تعداد ریدایرکت بیش از حد مجاز است.', 'unsafe_redirect');
}
