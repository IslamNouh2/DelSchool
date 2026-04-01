import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { ParentController } from './parent.controller';
import { LocalService } from 'src/local/local.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeeModule } from 'src/fee/fee.module';

@Module({
  imports: [FeeModule],
  controllers: [StudentController, ParentController],
  providers: [StudentService, LocalService, PrismaService],
  exports: [StudentService],
})
export class StudentModule {}
