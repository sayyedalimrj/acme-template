import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { resetAdaptersForTests } from '@/adapters';
import { SessionProvider, useSession } from '@/session/SessionProvider';

beforeEach(() => {
  resetAdaptersForTests();
});

function Probe(): React.JSX.Element {
  const { status, user, portal, signIn, signOut, setPortal } = useSession();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="user">{user?.email ?? 'none'}</Text>
      <Text testID="portal">{portal}</Text>
      <Pressable testID="signin" onPress={() => signIn({ email: 'alex@store.test' })}>
        <Text>in</Text>
      </Pressable>
      <Pressable
        testID="signin-admin"
        onPress={() => signIn({ email: 'owner@store.test', portal: 'admin' })}
      >
        <Text>in-admin</Text>
      </Pressable>
      <Pressable testID="switch-affiliate" onPress={() => setPortal('affiliate')}>
        <Text>switch</Text>
      </Pressable>
      <Pressable testID="signout" onPress={() => signOut()}>
        <Text>out</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

describe('SessionProvider (auth boundary)', () => {
  it('starts unauthenticated (sign-in boundary)', () => {
    renderProbe();
    expect(screen.getByTestId('status').props.children).toBe('unauthenticated');
    expect(screen.getByTestId('user').props.children).toBe('none');
  });

  it('mock sign-in creates a usable session', async () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('signin'));
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));
    expect(screen.getByTestId('user').props.children).toBe('alex@store.test');
  });

  it('defaults to the merchant portal and follows the chosen portal at sign-in', async () => {
    renderProbe();
    expect(screen.getByTestId('portal').props.children).toBe('merchant');

    fireEvent.press(screen.getByTestId('signin-admin'));
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));
    expect(screen.getByTestId('portal').props.children).toBe('admin');
  });

  it('can switch the portal in-app and resets to merchant on sign-out', async () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('signin-admin'));
    await waitFor(() => expect(screen.getByTestId('portal').props.children).toBe('admin'));

    fireEvent.press(screen.getByTestId('switch-affiliate'));
    await waitFor(() => expect(screen.getByTestId('portal').props.children).toBe('affiliate'));

    fireEvent.press(screen.getByTestId('signout'));
    await waitFor(() => expect(screen.getByTestId('portal').props.children).toBe('merchant'));
  });

  it('sign-out clears the session', async () => {
    renderProbe();
    fireEvent.press(screen.getByTestId('signin'));
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('authenticated'));

    fireEvent.press(screen.getByTestId('signout'));
    await waitFor(() =>
      expect(screen.getByTestId('status').props.children).toBe('unauthenticated'),
    );
    expect(screen.getByTestId('user').props.children).toBe('none');
  });
});
