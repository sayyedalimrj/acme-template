import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/renderWithProviders';
import { AdminHomeScreen } from '@/features/admin/AdminHomeScreen';
import { AdminMerchantsScreen } from '@/features/admin/AdminMerchantsScreen';
import { AdminMarketersScreen } from '@/features/admin/AdminMarketersScreen';
import { AdminPayoutsScreen } from '@/features/admin/AdminPayoutsScreen';
import { ADMIN_MERCHANTS } from '@/features/admin/adminMockData';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), replace: jest.fn(), back: jest.fn(), push: jest.fn() }),
}));

describe('Admin portal screens (RTL, mock)', () => {
  it('renders the admin overview with KPIs and quick actions', () => {
    renderWithProviders(<AdminHomeScreen />, { direction: 'rtl' });
    expect(screen.getByTestId('admin-home-screen')).toBeTruthy();
    expect(screen.getByTestId('admin-qa-merchants')).toBeTruthy();
    expect(screen.getByTestId('admin-qa-payouts')).toBeTruthy();
  });

  it('lists merchants and filters them by search', () => {
    renderWithProviders(<AdminMerchantsScreen />, { direction: 'rtl' });
    const first = ADMIN_MERCHANTS[0];
    expect(screen.getByTestId(`admin-merchant-${first.id}`)).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('admin-merchants-search'), 'آرین');
    // Only the matching merchant remains.
    expect(screen.getByTestId('admin-merchant-m-1002')).toBeTruthy();
    expect(screen.queryByTestId(`admin-merchant-${first.id}`)).toBeNull();
  });

  it('renders the marketer network', () => {
    renderWithProviders(<AdminMarketersScreen />, { direction: 'rtl' });
    expect(screen.getByTestId('admin-marketers-screen')).toBeTruthy();
    expect(screen.getByTestId('admin-marketer-mk-01')).toBeTruthy();
  });

  it('advances a payout request through its mock lifecycle', () => {
    renderWithProviders(<AdminPayoutsScreen />, { direction: 'rtl' });
    // po-501 starts as "requested" → tapping the action approves it.
    // po-502 already shows "ثبت پرداخت" (approved); po-501 shows "تأیید" (requested).
    expect(screen.getAllByText('ثبت پرداخت')).toHaveLength(1);
    fireEvent.press(screen.getByTestId('admin-payout-action-po-501'));
    // After approving po-501 there are now two "ثبت پرداخت" actions.
    expect(screen.getAllByText('ثبت پرداخت')).toHaveLength(2);
  });
});
