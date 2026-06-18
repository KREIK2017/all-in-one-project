import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Обгортка: ловить помилки з async-хендлера й передає їх у next() -> errorHandler
export default (fn: AsyncFn): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
