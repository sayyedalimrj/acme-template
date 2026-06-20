/**
 * Global error boundary — prevents blank white screens on uncaught render errors.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';

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
          <Text variant="heading">خطایی رخ داد</Text>
          <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
            {this.props.scope
              ? `مشکلی در بخش «${this.props.scope}» پیش آمد.`
              : 'مشکلی در بارگذاری صفحه پیش آمد.'}
          </Text>
          <Button label="تلاش مجدد" variant="primary" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}
