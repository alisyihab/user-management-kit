import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const stack =
      exception instanceof HttpException
        ? exception.stack
        : (exception as any).stack;

    this.logger.error({
      message: `Exception on ${request.method} ${request.url}`,
      method: request.method,
      path: request.url,
      statusCode: status,
      errorMessage: message,
      stack,
    });

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
