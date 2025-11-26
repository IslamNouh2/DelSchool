import { Module } from '@nestjs/common';
import { ExamController } from './exams.controller';
import { ExamService } from './exams.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ExamRepository } from './exam.repository';

@Module({
  imports:[PrismaModule],
  controllers: [ExamController],
  providers: [ExamService, ExamRepository]
})
export class ExamsModule {}
