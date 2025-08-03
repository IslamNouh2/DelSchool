import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import * as cookieParser from 'cookie-parser';
import { SubjectModule } from './subject/subject.module';
import { ParameterModule } from './parameter/parameter.module';
import { LocalModule } from './local/local.module';
import { SubjectLocalModule } from './subject-local/subject-local.module';
import { ClassModule } from './class/class.module';
import { StudentModule } from './student/student.module';
import { EmployerModule } from './teacher/employer.module';
import { TeacherSubjectModule } from './teacher-subject/teacher-subject.module';
import { TeacherClassModule } from './teacher-class/teacher-class.module';
import { TimetableModule } from './timetable/timetable.module';
import { TimeSlotModule } from './time-slot/time-slot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    SubjectModule,
    ParameterModule,
    LocalModule,
    SubjectLocalModule,
    ClassModule,
    StudentModule,
    EmployerModule,
    TeacherSubjectModule,
    TeacherClassModule,
    TimetableModule,
    TimeSlotModule
  ],
  
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}