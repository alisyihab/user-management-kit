import { DocumentBuilder } from '@nestjs/swagger';

interface SwaggerOptions {
  title: string;
  description: string;
  version?: string;
  serverPrefix?: string;
}

export function createSwaggerConfig({
  title,
  description,
  version = '1.0',
  serverPrefix = '/api/v1',
}: SwaggerOptions) {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addServer(serverPrefix)
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-internal-key',
        in: 'header',
      },
      'internal-key',
    )
    .setContact('Ali Syihab', 'https://github.com/alisyihab', 'ali.syihab@gmail.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();
}
