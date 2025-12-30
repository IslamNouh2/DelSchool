import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function runSeedIfNeeded() {
  const count = await prisma.user.count();   // pick any table
  if (count === 0) {
    console.log('🌱 Running seed...');
    await import('../prisma/seed');  // adjust path
  } else {
    console.log('✔ Seed skipped (data exists)');
  }
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('School Subjects API')
    .setDescription('APIs for managing hierarchical subjects')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  app.setGlobalPrefix('api');

  await runSeedIfNeeded();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',                 // local dev
      'https://delschool-2.onrender.com',    // DEPLOYED FRONTEND
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

 

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    validationError: {
      target: true,
      value: true,
    },
  }));

  await app.listen(47005);
}
bootstrap();
