import { IsString, IsDateString } from 'class-validator';

export class CreateTimeSlotDto {
    @IsString()
    label: string;

    @IsDateString()
    startTime: string;

    @IsDateString()
    endTime: string;
}
