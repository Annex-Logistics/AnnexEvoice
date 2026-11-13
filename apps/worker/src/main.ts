import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { WorkerModule } from './worker.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  process.on('SIGTERM', () => app.close());
  process.on('SIGINT', () => app.close());
  // eslint-disable-next-line no-console
  console.log('AnnexEvoice worker started');
}

bootstrap();
