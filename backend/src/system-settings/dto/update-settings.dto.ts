import { IsEnum, IsInt, IsString, Matches, Min } from 'class-validator';
import { WeekDay } from '@prisma/client';

export class UpdateSettingsDto {
  @IsEnum(WeekDay)
  weekStartDay: WeekDay;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'firstHour must be in HH:mm format',
  })
  firstHour: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'lastHour must be in HH:mm format',
  })
  lastHour: string;

  @IsInt()
  @Min(15)
  slotDuration: number;
}
