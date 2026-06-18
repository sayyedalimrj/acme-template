/**
 * Verification route ("/verify"). Thin wrapper around the mock 4-digit OTP screen.
 * UI-only — no code is sent, generated, or validated against any provider.
 */
import React from 'react';

import { OtpVerificationScreen } from '@/features/auth/OtpVerificationScreen';

export default function VerifyRoute(): React.JSX.Element {
  return <OtpVerificationScreen />;
}
