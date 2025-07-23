import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { LocalService } from 'src/local/local.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService,LocalService,PrismaService],
})
export class StudentModule {}
