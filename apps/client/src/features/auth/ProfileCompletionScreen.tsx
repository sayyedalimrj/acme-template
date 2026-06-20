/**
 * ProfileCompletionScreen — first-login profile completion (real backend).
 *
 * Shown by the authenticated layouts when the backend reports `profileComplete === false`
 * (a new/incomplete user after OTP login). Collects first name, last name, and email (all
 * required), saves them server-side via `completeProfile`, and on success the session's
 * `profileComplete` flips to true so the layout re-renders straight to the dashboard.
 *
 * Existing complete users never see this screen. The form is pre-filled from any name the
 * backend already has so a partial profile is easy to finish.
 */
import React, { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';

import { AuthField } from './components/AuthField';
import { AuthFrame } from './components/AuthFrame';
import { AuthPrimaryButton } from './components/AuthPrimaryButton';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitName(name: string | undefined): { first: string; last: string } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function ProfileCompletionScreen(): React.JSX.Element {
  const t = useT();
  const { user, completeProfile } = useSession();

  const initial = splitName(user?.name);
  const [firstName, setFirstName] = useState(initial.first);
  const [lastName, setLastName] = useState(initial.last);
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const canSubmit =
    firstName.trim().length > 0 && lastName.trim().length > 0 && EMAIL_RE.test(email.trim());

  const onSubmit = (): void => {
    const nextErrors: FieldErrors = {};
    if (firstName.trim().length === 0) nextErrors.firstName = t('register.errorFirstName');
    if (lastName.trim().length === 0) nextErrors.lastName = t('register.errorLastName');
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = t('profile.complete.errorEmail');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSaveError(undefined);
    void completeProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    })
      .catch((e: unknown) => {
        setSaveError(e instanceof Error ? e.message : t('profile.complete.errorSave'));
      })
      .finally(() => setSubmitting(false));
  };

  const clearError = (key: keyof FieldErrors): void => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  return (
    <AuthFrame
      testID="profile-completion-screen"
      iconName="person-add-outline"
      title={t('profile.complete.title')}
      subtitle={t('profile.complete.subtitle')}
    >
      <AuthField
        testID="profile-first-name"
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
        testID="profile-last-name"
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
        testID="profile-email"
        label={t('profile.complete.email')}
        placeholder={t('register.emailPlaceholder')}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          clearError('email');
        }}
        keyboardType="email-address"
        forceLtrValue
        error={errors.email ?? saveError}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <AuthPrimaryButton
        testID="profile-submit"
        label={t('profile.complete.submit')}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
      />
    </AuthFrame>
  );
}
