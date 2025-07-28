import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from './swagger.config';

interface GenerateSwaggerOptions {
  title: string;
  description: string;
  version?: string;
  serverPrefix?: string;
}

export function generateSwaggerDocument(
  app: INestApplication,
  opts: GenerateSwaggerOptions
) {
  const config = createSwaggerConfig(opts);
  return SwaggerModule.createDocument(app, config);
}
