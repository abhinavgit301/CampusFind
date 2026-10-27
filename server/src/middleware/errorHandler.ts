import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[GlobalErrorHandler]', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Malformed identifier format.' });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ error: 'Duplicate entry detected.' });
    return;
  }

  if (err.message && err.message.includes('Invalid file format')) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error. Please try again later.',
  });
}
