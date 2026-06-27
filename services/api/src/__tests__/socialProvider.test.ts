import { defaultCapabilities, providerForPlatform } from '../services/social/types';

describe('social provider basics', () => {
  it('returns platform-specific capabilities', () => {
    const caps = defaultCapabilities('instagram');
    expect(caps.publishCarousel).toBe(true);
    expect(caps.editPost).toBe(false);
  });

  it('publishProduct returns external post id for idempotent tracking', async () => {
    const provider = providerForPlatform('telegram', 'Test Channel');
    const result = await provider.publishProduct({
      productId: '101',
      name: 'Test',
      price: '1000',
      currency: 'IRR',
      imageUrls: [],
    });
    expect(result.externalPostId).toMatch(/^manual-telegram-/);
  });
});
