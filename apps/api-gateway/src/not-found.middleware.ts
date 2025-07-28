import { Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response) {
  console.log('🚫 Not Found:', req.method, req.url);
  res.status(404).json({
    statusCode: 404,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
}
