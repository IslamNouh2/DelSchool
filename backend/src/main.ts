import * as dotenv from 'dotenv';
// Load environment variables early
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
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // ================= SECURE CORS CONFIGURATION =================
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow if no origin (e.g. server-to-server or mobile app)
      // or if not in production
      // or if origin is in the allowed list
      if (!origin || !isProduction || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS: Origin ${origin} is not allowed.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Operation-Id',
      'X-Tenant-Id',
      'Cache-Control',
      'Pragma',
      'Expires',
    ],
    exposedHeaders: ['Set-Cookie', 'X-Operation-Id'],
  });

  // 🔒 Hide Express fingerprint
  const server = app.getHttpAdapter().getInstance() as express.Application;
  server.disable('x-powered-by');

  // 🔒 Helmet (advanced config)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
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
