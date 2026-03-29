import { Module } from '@nestjs/common';
import { SubjectLocalService } from './subject-local.service';
import { SubjectLocalController } from './subject-local.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SubjectLocalController],
  providers: [SubjectLocalService],
})
export class SubjectLocalModule {}
