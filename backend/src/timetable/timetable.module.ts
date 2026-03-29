import { Module } from '@nestjs/common';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { TimetableOptimizerModule } from '../timetable-optimizer/timetable-optimizer.module';

@Module({
  imports: [PrismaModule, SocketModule, TimetableOptimizerModule],
  controllers: [TimetableController],
  providers: [TimetableService],
})
export class TimetableModule {}
