import * as dotenv from 'dotenv';
import { Request, Response, Application } from 'express';
dotenv.config();

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // ✅ Global Error Handler
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // ✅ Global Prefix
  app.setGlobalPrefix('api');

  // ✅ Swagger (disable in production if needed)
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

  // ================= SECURITY =================

  // ✅ Helmet (strong config)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // avoid breaking Next.js
    }),
  );

  // ✅ Compression
  app.use(compression());

  // ✅ Cookies
  app.use(cookieParser());

  // ✅ Handle preflight manually (Railway fix)
  (app.getHttpAdapter().getInstance() as Application).options(
    '*',
    (req: Request, res: Response) => {
      res.sendStatus(200);
    },
  );

  // ✅ CORS (flexible + secure)
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      const allowed = [
        'localhost',
        'vercel.app',
        'railway.app',
        'onrender.com',
      ];

      const isAllowed = allowed.some((o) => origin.includes(o));

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // ================= VALIDATION =================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ================= START =================

  const port = process.env.PORT || 47005;
  await app.listen(port);

  console.log(`🚀 Server running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start:', err);
});
