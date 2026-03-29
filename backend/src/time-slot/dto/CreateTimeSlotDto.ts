import { IsString, Matches } from 'class-validator';

export class CreateTimeSlotDto {
  @IsString()
  label: string;

  // ✅ Only HH:mm format allowed (24-hour)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;
}
