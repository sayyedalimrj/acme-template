import { describe, expect, it } from '@jest/globals';

import { advisorRecommendations } from '@/mock/data/aiAdvisor';
import {
  advisorReply,
  advisorReplyKind,
  groupRecommendations,
  priorityMeta,
  recStatusMeta,
} from '@/features/advisor/advisorHelpers';

describe('advisor helpers', () => {
  it('classifies messages into reply kinds via local keyword matching', () => {
    expect(advisorReplyKind('امروز برای افزایش فروش چه کار کنم؟')).toBe('sales');
    expect(advisorReplyKind('کدام محصولات نیاز به موجودی دارند؟')).toBe('inventory');
    expect(advisorReplyKind('برای مشتریان VIP چه کمپینی پیشنهاد می‌کنی؟')).toBe('retention');
    expect(advisorReplyKind('برای این محصول توضیح بهتر بنویس')).toBe('copy');
    expect(advisorReplyKind('برای محصول ناموجود کمپین پیامکی پیشنهاد بده')).toBe('sms_restock');
    expect(advisorReplyKind('ایده عکس و ویدئوی تبلیغاتی بده')).toBe('media');
    expect(advisorReplyKind('سلام')).toBe('generic');
  });

  it('produces a deterministic reply with a review-only disclaimer', () => {
    const a = advisorReply('افزایش فروش');
    const b = advisorReply('افزایش فروش');
    expect(a).toBe(b);
    expect(a).toContain('پیشنهاد نمونه');
  });

  it('maps priority and status to tones', () => {
    expect(priorityMeta('high').tone).toBe('danger');
    expect(recStatusMeta('reviewed').tone).toBe('success');
  });

  it('groups recommendations by category in canonical order', () => {
    const groups = groupRecommendations(advisorRecommendations);
    expect(groups[0].category).toBe('sales');
    expect(groups.map((g) => g.category)).toContain('media');
  });
});
