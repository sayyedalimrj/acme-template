/**
 * Referral code field — required for store onboarding.
 */
import React, { useState } from 'react';

import { FormField, Input } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

export interface ReferralCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  touched?: boolean;
}

export function ReferralCodeField({
  value,
  onChange,
  disabled,
  touched,
}: ReferralCodeFieldProps): React.JSX.Element {
  const t = useT();
  const [localTouched, setLocalTouched] = useState(false);
  const showError = (touched || localTouched) && value.trim().length === 0;
  return (
    <FormField label={t('onboarding.referral.label')} required error={showError ? t('onboarding.referral.required') : undefined}>
      <Input
        testID="referral-code-input"
        value={value}
        onChangeText={onChange}
        onBlur={() => setLocalTouched(true)}
        placeholder={t('onboarding.referral.placeholder')}
        autoCapitalize="characters"
        editable={!disabled}
        invalid={showError}
      />
    </FormField>
  );
}
