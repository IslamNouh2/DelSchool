import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function runSeedIfNeeded() {
  console.log('🔍 Checking seed status...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });

  const rootSubject = await prisma.subject.findUnique({
    where: { subjectId: -1 },
  });

  const rootCompte = await prisma.compte.findUnique({
    where: { id: -1 },
  });

  const parameter = await prisma.parameter.findUnique({
    where: { paramId: 1 },
  });

  const parent = await prisma.parent.findUnique({
    where: { parentId: 1 },
  });

  // if ANY is missing → run seed
  if (!admin || !rootSubject || !rootCompte || !parameter || !parent) {
    console.log('🌱 Running seed (missing data detected)...');
    await import('../prisma/seed');
  } else {
    console.log('✔ Seed skipped — all required data exists');
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
