/**
 * Wrap an async Express handler so rejected promises are forwarded to the error middleware.
 */
import type { NextFunction, Request, Response } from 'express';

type Handler<R extends Request> = (req: R, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler<R extends Request = Request>(handler: Handler<R>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req as R, res, next).catch(next);
  };
}
