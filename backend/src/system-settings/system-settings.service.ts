import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    let settings = await this.prisma.systemSettings.findFirst({
      where: { tenantId },
    });

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          tenantId,
        },
      });
    }

    return settings;
  }

  async updateSettings(tenantId: string, dto: UpdateSettingsDto) {
    const settings = await this.getSettings(tenantId);
    
    return this.prisma.systemSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }
}
