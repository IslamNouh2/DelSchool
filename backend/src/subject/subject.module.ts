// src/subjects/subject.module.ts
import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 👈 make PrismaService available
  controllers: [SubjectController],
  providers: [SubjectService],
})
export class SubjectModule { }
