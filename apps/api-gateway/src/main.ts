import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonTransports } from '@libs/logger/src';
import { createNestProxyMiddleware } from '@libs/proxy/src';
import { Request, Response, Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: winstonTransports,
    }),
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, Internal-Key',
    credentials: true,
  });

  const expressApp: Express = app.getHttpAdapter().getInstance() as Express;

  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(null, {
        explorer: true,
        swaggerOptions: {
          urls: [
            {
              url: '/docs-json/auth',
              name: 'Auth Service',
            },
            {
              url: '/docs-json/backoffice',
              name: 'Backoffice Service',
            },
          ],
        },
      }),
    );
  } else {
    app.use('/docs', (_: Request, res: Response) => {
      return res
        .status(404)
        .send('Swagger documentation is disabled in production');
    });
  }

  // Proxy Middleware dengan type yang tepat
  expressApp.use(
    createNestProxyMiddleware() as unknown as (
      req: Request,
      res: Response,
      next: () => void,
    ) => void,
  );

  // Fallback handler
  expressApp.use((req: Request, res: Response) => {
    console.error('Not Found:', req.method, req.url);
    res.status(404).json({
      statusCode: 404,
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.url}`,
    });
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
