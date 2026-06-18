import { Request, Response, NextFunction } from 'express';

// Один обробник помилок на весь застосунок (реєструється останнім у server.ts)
export default (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Server error' });
};
