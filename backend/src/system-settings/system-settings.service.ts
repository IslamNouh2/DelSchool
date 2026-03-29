import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    return this.prisma.systemSettings.upsert({
      where: { tenantId },
      update: {},
      create: {
        tenantId,
      },
    });
  }

  async updateSettings(tenantId: string, dto: UpdateSettingsDto) {
    const settings = await this.getSettings(tenantId);

    return this.prisma.systemSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }
}
