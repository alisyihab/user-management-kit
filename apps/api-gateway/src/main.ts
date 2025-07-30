import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { winstonTransports } from '@libs/logger/src';
import { createNestProxyMiddleware } from '@libs/proxy/src';
import { RequestLoggerMiddleware } from './request-logger.middleware';
import { Request, Response, Express, NextFunction } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ transports: winstonTransports }),
  });

  // Enable global filters (for logging errors)
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)),
  );

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, Internal-Key',
    credentials: true,
  });

  const expressApp: Express = app.getHttpAdapter().getInstance() as Express;

  // Request Logger Middleware
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const middleware = new RequestLoggerMiddleware(
      app.get(WINSTON_MODULE_NEST_PROVIDER),
    );
    middleware.use(req, res, next);
  });

  // Swagger
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(null, {
        explorer: true,
        swaggerOptions: {
          urls: [
            { url: '/docs-json/auth', name: 'Auth Service' },
            { url: '/docs-json/backoffice', name: 'Backoffice Service' },
          ],
        },
      }),
    );
  } else {
    app.use('/docs', (_: Request, res: Response) => {
      res.status(404).send('Swagger documentation is disabled in production');
    });
  }

  // Proxy Middleware
  expressApp.use(createNestProxyMiddleware());

  // Fallback 404
  expressApp.use((req: Request, res: Response) => {
    const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    logger.warn(`404 - ${req.method} ${req.url}`, { statusCode: 404 });

    res.status(404).json({
      statusCode: 404,
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.url}`,
    });
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
