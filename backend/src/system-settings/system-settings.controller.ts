import { Controller, Get, Body, Put, UseGuards, Req } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('system-settings')
@UseGuards(AuthGuard('jwt'))
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  getSettings(@Req() req) {
    return this.systemSettingsService.getSettings(req.user.tenantId);
  }

  @Put()
  updateSettings(@Req() req, @Body() dto: UpdateSettingsDto) {
    return this.systemSettingsService.updateSettings(req.user.tenantId, dto);
  }
}
