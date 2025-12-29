import { Module } from '@nestjs/common';
import { FeeService } from './fee.service';
import { FeeController } from './fee.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FeeController],
  providers: [FeeService, PrismaService],
})
export class FeeModule {}
