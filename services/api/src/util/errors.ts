/**
 * Safe application error: carries an HTTP status + stable code + safe message (no secrets).
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg: string, code = 'validation_error') => new AppError(400, code, msg);
export const unauthorized = (msg = 'احراز هویت لازم است.') => new AppError(401, 'unauthorized', msg);
export const forbidden = (msg = 'دسترسی مجاز نیست.') => new AppError(403, 'forbidden', msg);
export const notFound = (msg = 'یافت نشد.', code = 'not_found') => new AppError(404, code, msg);
export const conflict = (msg: string, code = 'conflict') => new AppError(409, code, msg);
export const badGateway = (msg = 'ارتباط با سرویس بیرونی ناموفق بود.', code = 'upstream_error') =>
  new AppError(502, code, msg);
export const tooMany = (
  msg = 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
  code = 'rate_limited',
) => new AppError(429, code, msg);
