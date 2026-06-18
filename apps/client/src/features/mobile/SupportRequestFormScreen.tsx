/**
 * SupportRequestFormScreen — a simple "new request" form (mock).
 *
 * Lets the merchant open a support request: subject, category, and a message. On submit it
 * validates the fields and shows a calm success state. This is mock-only — nothing is sent,
 * no backend, no provider. Customer-friendly copy only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { StringKey } from '@/i18n/strings';

import {
  AnimatedSection,
  AppCard,
  FilterChipRow,
  MobileButton,
  MobilePage,
  MobileSubHeader,
  MobileTextField,
} from './components';
import { mobileColors, mobileMetrics, mobileType } from './mobileTokens';

type Category = 'orders' | 'payments' | 'site' | 'other';

const CATEGORIES: readonly { value: Category; labelKey: StringKey }[] = [
  { value: 'orders', labelKey: 'support.category.orders' },
  { value: 'payments', labelKey: 'support.category.payments' },
  { value: 'site', labelKey: 'support.category.site' },
  { value: 'other', labelKey: 'support.category.other' },
];

export function SupportRequestFormScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Category>('orders');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/support' as never);
    }
  };

  const onSubmit = (): void => {
    const next: { subject?: string; message?: string } = {};
    if (subject.trim().length === 0) {
      next.subject = t('support.new.errorSubject');
    }
    if (message.trim().length === 0) {
      next.message = t('support.new.errorMessage');
    }
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // Mock submit — nothing is sent anywhere.
      setSubmitted(true);
    }
  };

  return (
    <MobilePage
      testID="support-new-screen"
      header={
        <MobileSubHeader
          title={t('support.new.title')}
          onBack={onBack}
          backLabel={t('mobile.back')}
        />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, paddingTop: 8 }}>
        {submitted ? (
          <AnimatedSection index={0}>
            <AppCard padding={24} testID="support-new-success">
              <View style={{ alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 24,
                    backgroundColor: mobileColors.statusActiveSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark-circle" size={42} color={mobileColors.statusActive} />
                </View>
                <Text
                  style={{
                    fontSize: mobileType.sectionSize,
                    fontWeight: '700',
                    color: mobileColors.text,
                    textAlign: 'center',
                  }}
                >
                  {t('support.new.successTitle')}
                </Text>
                <Text
                  style={{
                    fontSize: mobileType.bodySize,
                    color: mobileColors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 23,
                  }}
                >
                  {t('support.new.successBody')}
                </Text>
                <View style={{ alignSelf: 'stretch', marginTop: 4 }}>
                  <MobileButton
                    label={t('support.new.successCta')}
                    onPress={onBack}
                    testID="support-new-success-cta"
                  />
                </View>
              </View>
            </AppCard>
          </AnimatedSection>
        ) : (
          <AnimatedSection index={0}>
            <AppCard padding={18}>
              <View style={{ gap: 16 }}>
                <MobileTextField
                  label={t('support.new.subject')}
                  value={subject}
                  onChangeText={(next) => {
                    setSubject(next);
                    if (errors.subject) {
                      setErrors((prev) => ({ ...prev, subject: undefined }));
                    }
                  }}
                  placeholder={t('support.new.subjectPlaceholder')}
                  error={errors.subject}
                  testID="support-new-subject"
                />

                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontSize: mobileType.labelSize,
                      fontWeight: '600',
                      color: mobileColors.text,
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {t('support.new.category')}
                  </Text>
                  <FilterChipRow
                    options={CATEGORIES.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
                    value={category}
                    onChange={setCategory}
                    testID="support-new-category"
                  />
                </View>

                <MobileTextField
                  label={t('support.new.message')}
                  value={message}
                  onChangeText={(next) => {
                    setMessage(next);
                    if (errors.message) {
                      setErrors((prev) => ({ ...prev, message: undefined }));
                    }
                  }}
                  placeholder={t('support.new.messagePlaceholder')}
                  error={errors.message}
                  multiline
                  testID="support-new-message"
                />

                <MobileButton
                  label={t('support.new.submit')}
                  onPress={onSubmit}
                  icon="paper-plane-outline"
                  testID="support-new-submit"
                />
              </View>
            </AppCard>
          </AnimatedSection>
        )}
      </View>
    </MobilePage>
  );
}
