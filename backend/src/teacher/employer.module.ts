import { Module } from '@nestjs/common';
import { EmployerService } from './employer.service';
import { EmployerController } from './employer.controller';

import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EmployerController],
  providers: [EmployerService, PrismaService],
  exports: [EmployerService],
})
export class EmployerModule {}
