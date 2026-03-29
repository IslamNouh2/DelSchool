import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import * as express from 'express';

import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://del-school-bvev.vercel.app',
    'https://delschool-production.up.railway.app',
  ];

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'X-Operation-Id',
        'X-Tenant-Id',
        'Cache-Control',
        'Pragma',
        'Expires',
      ],
      exposedHeaders: ['Set-Cookie', 'X-Operation-Id'],
    },
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const server = app.getHttpAdapter().getInstance() as express.Application;

  // ================= SECURITY =================

  // 🔒 Hide Express fingerprint
  server.disable('x-powered-by');

  // 🔒 Helmet (advanced config)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // avoid breaking Next.js
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
    }),
  );

  // 🔒 Prevent large payload attacks
  app.use(express.json({ limit: '1mb' }));

  // 🔒 Compression
  app.use(compression());

  // 🔒 Cookies
  app.use(cookieParser());

  // ================= GLOBAL FILTER =================

  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // ================= VALIDATION =================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ================= ROUTING =================

  app.setGlobalPrefix('api');

  // ================= SWAGGER =================

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DelSchool API')
      .setDescription('DelSchool API Docs')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // ================= START =================

  const port = process.env.PORT || 47005;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on: http://0.0.0.0:${port}`);
}

bootstrap().catch((err: Error) => {
  console.error('❌ Failed to start:', err);
});
