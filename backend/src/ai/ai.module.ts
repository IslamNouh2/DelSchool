import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiService } from './ai.service';
import { TeacherEvaluationService } from './teacher-evaluation.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, TeacherEvaluationService],
  exports: [AiService, TeacherEvaluationService],
})
export class AiModule {}
