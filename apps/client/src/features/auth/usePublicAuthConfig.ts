/**
 * Public auth config from the backend (SMS dry-run flag, OTP length).
 */
import { useQuery } from '@tanstack/react-query';

import { getApiBaseUrl, isApiConfigured } from '@/config/api.config';

export interface PublicAuthConfig {
  smsDryRun: boolean;
  otpLength: number;
  otpResendCooldownSeconds: number;
}

const MOCK_CONFIG: PublicAuthConfig = {
  smsDryRun: true,
  otpLength: 4,
  otpResendCooldownSeconds: 60,
};

async function fetchPublicAuthConfig(): Promise<PublicAuthConfig> {
  const res = await fetch(`${getApiBaseUrl()}/auth/public-config`, { cache: 'no-store' });
  if (!res.ok) throw new Error('config fetch failed');
  return res.json() as Promise<PublicAuthConfig>;
}

export function usePublicAuthConfig(): PublicAuthConfig {
  const apiOn = isApiConfigured();
  const q = useQuery({
    queryKey: ['publicAuthConfig', getApiBaseUrl()],
    queryFn: fetchPublicAuthConfig,
    enabled: apiOn,
    staleTime: 60_000,
    retry: 1,
  });

  if (!apiOn) return MOCK_CONFIG;
  return q.data ?? { ...MOCK_CONFIG, smsDryRun: false };
}
