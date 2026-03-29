import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportCardService } from './report-card.service';
import { ReportCardController } from './report-card.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [ReportCardController],
  providers: [ReportCardService],
  exports: [ReportCardService],
})
export class ReportCardModule {}
