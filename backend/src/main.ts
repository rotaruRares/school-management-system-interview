import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { securityHeaders } from './common/security-headers.js';
import { createValidationPipe } from './common/validation/validation-pipe.factory.js';
import { getConfig } from './config/app-config.js';

try {
  process.loadEnvFile();
} catch {}

async function bootstrap() {
  const config = getConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.disable('x-powered-by');
  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }
  app.use(securityHeaders);
  app.useBodyParser('json', { limit: '100kb' });
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
  app.useGlobalPipes(createValidationPipe());
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('School Management System API')
      .setDescription(
        'REST API for students, teachers, classes and grades. Log in with POST /api/auth/login, then use the returned access token as a Bearer token.',
      )
      .setVersion('2.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.port);
}

bootstrap();
