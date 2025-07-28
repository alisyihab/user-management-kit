import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { generateSwaggerDocument } from '@libs/swagger/src';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger doc generator reusable dari libs
  const document = generateSwaggerDocument(app, {
    title: 'Backoffice Service',
    description: 'API documentation for Backoffice Service',
    serverPrefix: '/api/v1',
  });

  // Serve Swagger JSON
  app.use('/docs-json', (_: any, res: { json: (arg0: OpenAPIObject) => any; }) => res.json(document));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Swagger UI
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.BACKOFFICE_PORT ?? 3002);
}
bootstrap();
