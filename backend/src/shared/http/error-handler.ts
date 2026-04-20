import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './http-errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      data: {},
      settings: {
        status: err.status,
        message: err.message
      }
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);

  return res.status(500).json({
    data: {},
    settings: {
      status: 500,
      message: 'Internal Server Error'
    }
  });
}
