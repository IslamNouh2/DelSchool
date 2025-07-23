import { Module } from '@nestjs/common';
import { SubjectLocalService } from './subject-local.service';
import { SubjectLocalController } from './subject-local.controller';

@Module({
  controllers: [SubjectLocalController],
  providers: [SubjectLocalService],
})
export class SubjectLocalModule {}
