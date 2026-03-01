import { Module } from '@nestjs/common';
import { LocalService } from './local.service';
import { LocalController } from './local.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LocalController],
  providers: [LocalService],
})
export class LocalModule {}
