import { looksLikeMessageBody, mobileToE164 } from '../providers/ippanel/types';

describe('ippanel helpers', () => {
  it('converts Iranian mobile to E.164', () => {
    expect(mobileToE164('09123456789')).toBe('+989123456789');
  });

  it('rejects Persian text as pattern code', () => {
    expect(looksLikeMessageBody('کد تایید شما {{code}}')).toBe(true);
    expect(looksLikeMessageBody('ebvqrqy10gm3o04')).toBe(false);
  });
});
