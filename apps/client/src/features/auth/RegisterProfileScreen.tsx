/**
 * RegisterProfileScreen — first-time user profile completion (mobile-first).
 *
 * Collects the minimum to create a mock store-management account: first name, last name, and
 * mobile (required), plus optional email and business category. No password. On submit it
 * establishes an in-memory mock session (the auth layout then redirects to the dashboard).
 * Nothing is persisted; no backend, no provider.
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';

import { AuthField } from './components/AuthField';
import { AuthFrame } from './components/AuthFrame';
import { AuthPrimaryButton } from './components/AuthPrimaryButton';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
}

export function RegisterProfileScreen(): React.JSX.Element {
  const t = useT();
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ identifier?: string; channel?: string }>();

  const identifier = firstParam(params.identifier);
  const channel = firstParam(params.channel);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(channel === 'email' ? identifier : '');
  const [errors, setErrors] = useState<FieldErrors>({});

  // Refs let Enter jump to the next field (keyboard stays open) instead of dismissing it.
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // Live validity → the submit button is disabled until the required fields are valid.
  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const onSubmit = (): void => {
    const nextErrors: FieldErrors = {};
    if (firstName.trim().length === 0) {
      nextErrors.firstName = t('register.errorFirstName');
    }
    if (lastName.trim().length === 0) {
      nextErrors.lastName = t('register.errorLastName');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    // Mock session only (in-memory). The (auth) layout redirects to the dashboard.
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    void signIn({ name: fullName, email: email.trim() || undefined });
  };

  const clearError = (key: keyof FieldErrors): void => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  return (
    <AuthFrame
      testID="register-screen"
      iconName="person-add-outline"
      title={t('register.title')}
      subtitle={t('register.subtitle')}
    >
      <AuthField
        testID="register-first-name"
        label={t('register.firstName')}
        placeholder={t('register.firstNamePlaceholder')}
        value={firstName}
        onChangeText={(next) => {
          setFirstName(next);
          clearError('firstName');
        }}
        autoCapitalize="words"
        error={errors.firstName}
        returnKeyType="next"
        autoFocus
        onSubmitEditing={() => lastNameRef.current?.focus()}
      />
      <AuthField
        ref={lastNameRef}
        testID="register-last-name"
        label={t('register.lastName')}
        placeholder={t('register.lastNamePlaceholder')}
        value={lastName}
        onChangeText={(next) => {
          setLastName(next);
          clearError('lastName');
        }}
        autoCapitalize="words"
        error={errors.lastName}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthField
        ref={emailRef}
        testID="register-email"
        label={t('register.email')}
        placeholder={t('register.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        forceLtrValue
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <AuthPrimaryButton
        testID="register-submit"
        label={t('register.submit')}
        onPress={onSubmit}
        disabled={!canSubmit}
      />
    </AuthFrame>
  );
}
