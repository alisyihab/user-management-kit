import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response } from "express";

export interface SwaggerSetupOptions {
  title: string;
  description: string;
  version?: string;
  path?: string;
}

export function setupSwagger(
  app: INestApplication,
  options: SwaggerSetupOptions,
): void {
  const { title, description, version = "1.0", path = "docs" } = options;

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI
  SwaggerModule.setup(path, app, document);

  // Serve JSON spec for aggregation (used in gateway)
  app.use(`/${path}-json`, (req: Request, res: Response) => res.json(document));
}
