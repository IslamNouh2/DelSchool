import { Module } from '@nestjs/common';
import { TeacherClassService } from './teacher-class.service';
import { TeacherClassController } from './teacher-class.controller';

@Module({
  controllers: [TeacherClassController],
  providers: [TeacherClassService],
})
export class TeacherClassModule {}
