/**
 * CreateSiteScreen — "order a new store" flow (mock).
 *
 * Lets a merchant request a brand-new managed store: business name, domain, business category
 * (select), optional Instagram id, and a template chosen from a small gallery, then submit +
 * (mock) pay the subscription. Nothing is provisioned and no payment is taken — this is a
 * frontend-only request form; real provisioning/payment happens later on a secure backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useT } from '@/i18n/I18nProvider';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme';

import {
  useMobileColors,
  useMobileShadow,
  useMobileType,
} from '@/features/mobile/mobileTokens';

const CATEGORY_KEYS: StringKey[] = [
  'createSite.cat.clothing',
  'createSite.cat.food',
  'createSite.cat.digital',
  'createSite.cat.beauty',
  'createSite.cat.home',
  'createSite.cat.services',
];

interface TemplateOption {
  id: string;
  labelKey: StringKey;
  tint: string;
}

function FieldLabel({
  text,
  color,
  size,
  align,
}: {
  text: string;
  color: string;
  size: number;
  align: 'left' | 'right';
}): React.JSX.Element {
  return (
    <Text style={{ fontSize: size, fontWeight: '600', color, textAlign: align, marginBottom: 8 }}>
      {text}
    </Text>
  );
}

const TEMPLATES: TemplateOption[] = [
  { id: 'minimal', labelKey: 'createSite.tpl.minimal', tint: '#456EFE' },
  { id: 'bold', labelKey: 'createSite.tpl.bold', tint: '#7C5CFC' },
  { id: 'classic', labelKey: 'createSite.tpl.classic', tint: '#13B6A6' },
  { id: 'modern', labelKey: 'createSite.tpl.modern', tint: '#F08A3C' },
];

export function CreateSiteScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const type = useMobileType();
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [instagram, setInstagram] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const align = isRTL ? 'right' : 'left';
  const canSubmit =
    name.trim().length > 0 && domain.trim().length > 0 && Boolean(category) && Boolean(template);

  const fieldStyle = {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.tile,
    paddingHorizontal: 14,
    fontSize: type.bodySize,
    color: colors.text,
    textAlign: align as 'left' | 'right',
  };

  if (submitted) {
    return (
      <Screen title={t('createSite.title')} testID="create-site-screen">
        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.statusActiveSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={38} color={colors.statusActive} />
          </View>
          <Text style={{ fontSize: type.titleSize, fontWeight: '700', color: colors.text }}>
            {t('createSite.successTitle')}
          </Text>
          <Text
            style={{ fontSize: type.bodySize, color: colors.textSecondary, textAlign: 'center' }}
          >
            {t('createSite.successBody')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/' as never)}
            style={{
              marginTop: 8,
              height: 52,
              paddingHorizontal: 28,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: type.bodySize }}>
              {t('createSite.backHome')}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={t('createSite.title')} testID="create-site-screen">
      <View style={{ gap: 18 }}>
        <Text style={{ fontSize: type.bodySize, color: colors.textSecondary, textAlign: align }}>
          {t('createSite.intro')}
        </Text>

        <View>
          <FieldLabel text={t('createSite.nameLabel')} color={colors.text} size={type.labelSize} align={align} />
          <TextInput
            testID="create-site-name"
            value={name}
            onChangeText={setName}
            placeholder={t('createSite.namePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={fieldStyle}
          />
        </View>

        <View>
          <FieldLabel text={t('createSite.domainLabel')} color={colors.text} size={type.labelSize} align={align} />
          <TextInput
            testID="create-site-domain"
            value={domain}
            onChangeText={setDomain}
            placeholder={t('createSite.domainPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="url"
            style={{ ...fieldStyle, textAlign: 'left', writingDirection: 'ltr' }}
          />
        </View>

        <View>
          <FieldLabel text={t('createSite.categoryLabel')} color={colors.text} size={type.labelSize} align={align} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_KEYS.map((key) => {
              const selected = category === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.primary : colors.tile,
                  }}
                >
                  <Text
                    style={{
                      fontSize: type.captionSize,
                      fontWeight: '600',
                      color: selected ? colors.onPrimary : colors.text,
                    }}
                  >
                    {t(key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <FieldLabel text={t('createSite.instagramLabel')} color={colors.text} size={type.labelSize} align={align} />
          <TextInput
            testID="create-site-instagram"
            value={instagram}
            onChangeText={setInstagram}
            placeholder={t('createSite.instagramPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            style={{ ...fieldStyle, textAlign: 'left', writingDirection: 'ltr' }}
          />
        </View>

        <View>
          <FieldLabel text={t('createSite.templateLabel')} color={colors.text} size={type.labelSize} align={align} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingVertical: 2 }}
          >
            {TEMPLATES.map((tpl) => {
              const selected = template === tpl.id;
              return (
                <Pressable
                  key={tpl.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  testID={`create-site-template-${tpl.id}`}
                  onPress={() => setTemplate(tpl.id)}
                  style={[
                    {
                      width: 130,
                      borderRadius: 16,
                      backgroundColor: colors.card,
                      borderWidth: 2,
                      borderColor: selected ? colors.primary : 'transparent',
                      overflow: 'hidden',
                    },
                    shadow,
                  ]}
                >
                  <View
                    style={{
                      height: 96,
                      backgroundColor: tpl.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="browsers-outline" size={30} color="#FFFFFF" />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                    }}
                  >
                    <Text style={{ fontSize: type.captionSize, fontWeight: '700', color: colors.text }}>
                      {t(tpl.labelKey)}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 14,
              backgroundColor: colors.tile,
              padding: 14,
            },
          ]}
        >
          <Text style={{ fontSize: type.bodySize, color: colors.textSecondary }}>
            {t('createSite.priceLabel')}
          </Text>
          <Text style={{ fontSize: type.sectionSize, fontWeight: '700', color: colors.text }}>
            ۲٬۹۰۰٬۰۰۰ ﷼
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          testID="create-site-submit"
          disabled={!canSubmit}
          onPress={() => setSubmitted(true)}
          style={{
            height: 54,
            borderRadius: 14,
            backgroundColor: canSubmit ? colors.primary : colors.mutedSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: type.bodySize }}>
            {t('createSite.submit')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
