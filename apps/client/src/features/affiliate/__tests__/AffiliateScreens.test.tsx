import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/renderWithProviders';
import { AffiliateHomeScreen } from '@/features/affiliate/AffiliateHomeScreen';
import { AffiliateReferralsScreen } from '@/features/affiliate/AffiliateReferralsScreen';
import { AffiliateEarningsScreen } from '@/features/affiliate/AffiliateEarningsScreen';
import { AffiliatePayoutsScreen } from '@/features/affiliate/AffiliatePayoutsScreen';
import { AFFILIATE_PROFILE } from '@/features/affiliate/affiliateMockData';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), replace: jest.fn(), back: jest.fn(), push: jest.fn() }),
}));

describe('Affiliate portal screens (RTL, mock)', () => {
  it('renders the affiliate overview with the referral code', () => {
    renderWithProviders(<AffiliateHomeScreen />, { direction: 'rtl' });
    expect(screen.getByTestId('affiliate-home-screen')).toBeTruthy();
    expect(screen.getByText(AFFILIATE_PROFILE.code)).toBeTruthy();
    expect(screen.getByTestId('affiliate-qa-payouts')).toBeTruthy();
  });

  it('lists referrals and filters by status', () => {
    renderWithProviders(<AffiliateReferralsScreen />, { direction: 'rtl' });
    expect(screen.getByTestId('affiliate-referral-r-01')).toBeTruthy();
    // Filter to "lead" → only the lead referral remains.
    fireEvent.press(screen.getByLabelText('سرنخ'));
    expect(screen.getByTestId('affiliate-referral-r-04')).toBeTruthy();
    expect(screen.queryByTestId('affiliate-referral-r-01')).toBeNull();
  });

  it('renders the commission ledger', () => {
    renderWithProviders(<AffiliateEarningsScreen />, { direction: 'rtl' });
    expect(screen.getByTestId('affiliate-earnings-screen')).toBeTruthy();
    expect(screen.getByTestId('affiliate-commission-c-101')).toBeTruthy();
  });

  it('lets the marketer request a payout (mock)', () => {
    renderWithProviders(<AffiliatePayoutsScreen />, { direction: 'rtl' });
    const button = screen.getByTestId('affiliate-request-payout');
    fireEvent.press(button);
    expect(screen.getByText('درخواست ثبت شد')).toBeTruthy();
  });
});
