/**
 * Global error boundary — prevents blank white screens on uncaught render errors.
 *
 * IMPORTANT: this component can be mounted ABOVE the app providers (theme / i18n / query),
 * e.g. the root boundary in `app/_layout.tsx` wraps `ConfigBootstrap` + `AppProviders`. Its
 * fallback therefore MUST NOT use any themed/i18n-aware component (`@/components/ui`, `useT`,
 * `useTheme`, …) — doing so would throw again while rendering the fallback ("useTheme must be
 * used within a ThemeProvider") and leave the user on a blank page. The fallback below uses only
 * primitive `react-native` elements with inline styles so it can render anywhere.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional label for support context (e.g. portal name). */
  scope?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.scope ?? 'app', error.message, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            backgroundColor: '#EEF1F6',
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2A44', textAlign: 'center' }}>
            خطایی رخ داد
          </Text>
          <Text style={{ fontSize: 15, color: '#5B6577', textAlign: 'center', lineHeight: 22 }}>
            {this.props.scope
              ? `مشکلی در بخش «${this.props.scope}» پیش آمد.`
              : 'مشکلی در بارگذاری صفحه پیش آمد.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={this.reset}
            style={{
              backgroundColor: '#456EFE',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>تلاش مجدد</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
