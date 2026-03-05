import { Module } from '@nestjs/common';
import { TimetableOptimizerService } from './timetable-optimizer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [PrismaModule, SystemSettingsModule, SocketModule],
  providers: [TimetableOptimizerService],
  exports: [TimetableOptimizerService],
})
export class TimetableOptimizerModule {}
