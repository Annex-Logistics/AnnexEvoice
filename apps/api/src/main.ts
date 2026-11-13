import 'reflect-metadata';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { BigIntSerializerInterceptor } from './common/pipes/bigint-serializer.interceptor.js';
import { AllExceptionsFilter } from './common/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [process.env.APP_BASE_URL ?? 'http://localhost:5173', process.env.ADMIN_BASE_URL ?? 'http://localhost:5174'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const config = new DocumentBuilder()
    .setTitle('AnnexEvoice API')
    .setDescription('WhatsApp-first e-invoicing & tax compliance for Nigerian SMEs')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addServer(process.env.API_BASE_URL ?? 'http://localhost:3000')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.getHttpAdapter().get('/openapi.json', (_req, res) => res.json(document));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`AnnexEvoice API listening on :${port} (docs at /docs)`);
}

bootstrap();
