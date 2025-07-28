import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { SwaggerModule } from '@nestjs/swagger';
import { generateSwaggerDocument } from '@libs/swagger/src';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  // Swagger doc generator reusable dari libs
  const document = generateSwaggerDocument(app, {
    title: 'Auth Service',
    description: 'Endpoints for authentication and authorization',
    serverPrefix: '/api/v1',
  });

  // Serve Swagger JSON
  app.use('/docs-json', (_, res) => res.json(document));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Swagger UI
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.AUTH_PORT || 3001);
}
bootstrap();
