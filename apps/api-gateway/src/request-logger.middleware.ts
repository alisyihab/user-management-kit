import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.info(`[${res.statusCode}] ${req.method} ${req.originalUrl}`, {
        requestId,
        meta: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          duration,
        },
      });
    });

    next();
  }
}
