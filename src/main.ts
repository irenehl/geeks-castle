import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { configureSwagger } from './configure-swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  configureSwagger(app);

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: ['index.html'],
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache');
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`User service listening on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger UI at http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
