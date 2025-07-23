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
    EmployerModule
  ],
  
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}