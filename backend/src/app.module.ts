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
import { AttendanceModule } from './attendance/attendance.module';
import { ExamsModule } from './exams/exams.module';
import { CompteModule } from './compte/compte.module';
import { SocketModule } from './socket/socket.module';
import { SchoolYearModule } from './school-year/school-year.module';
import { TransitionModule } from './transition/transition.module';
import { PayrollModule } from './payroll/payroll.module';
import { PrismaModule } from 'prisma/prisma.module';
import { FeeModule } from './fee/fee.module';
import { PaymentModule } from './payment/payment.module';
import { ExpenseModule } from './expense/expense.module';
import { FinanceModule } from './finance/finance.module';
import { EventModule } from './event/event.module';

import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
        ttl: 60000,
        limit: 10,
    }]),
    PrismaModule,
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
    TimeSlotModule,
    AttendanceModule,
    ExamsModule,
    CompteModule,
    SocketModule,
    SchoolYearModule,
    TransitionModule,
    FeeModule,
    PaymentModule,
    PayrollModule,
    ExpenseModule,
    FinanceModule,
    EventModule,
  ],
  
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}