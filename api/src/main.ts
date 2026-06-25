/**
 * Jobmagic API bootstrap.
 * - Global '/api' prefix (mirrors the Next.js route surface).
 * - CORS for the Next.js frontend (configurable via CORS_ORIGIN, comma-separated).
 * - Global filter so every error is the { ok:false, error } ApiResponse envelope.
 * - Listens on PORT (default 4000).
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  app.setGlobalPrefix('api');
  // All input validation is handled by zod inside controllers; no class-validator pipe needed.
  app.useGlobalFilters(new AllExceptionsFilter());

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  Logger.log(`Jobmagic API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
