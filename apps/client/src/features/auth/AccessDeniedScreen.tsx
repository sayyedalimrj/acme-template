/**
 * Shown when the authenticated user's role is not allowed on this portal build.
 */
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { getActivePortal, getActivePortalMeta } from '@/config/portal.config';
import { useSession } from '@/session/SessionProvider';

export function AccessDeniedScreen(): React.JSX.Element {
  const router = useRouter();
  const { signOut, user } = useSession();
  const meta = getActivePortalMeta();
  const portal = getActivePortal();

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#EEF1F6' }}>
      <Text variant="heading">دسترسی مجاز نیست</Text>
      <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
        حساب شما ({user?.name ?? user?.email ?? 'کاربر'}) اجازه ورود به {meta.name} را ندارد.
      </Text>
      <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        پورتال فعلی: {portal}
      </Text>
      <Button
        label="بازگشت به ورود"
        variant="primary"
        onPress={() => {
          void signOut().then(() => router.replace('/sign-in' as Href));
        }}
      />
    </View>
  );
}
