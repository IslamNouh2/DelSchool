import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { BulkSyncDto } from './dto/sync-payload.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('sync')
@UseGuards( ThrottlerGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('bulk')
  async bulkSync(@Req() req: any, @Body() dto: BulkSyncDto) {
    const tenantId = req.tenantId;
    const userId = req.user.sub;
    return this.syncService.processBulkSync(tenantId, userId, dto);
  }
}
