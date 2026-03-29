import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeSlotDto } from './CreateTimeSlotDto';

export class UpdateTimeSlotDto extends PartialType(CreateTimeSlotDto) {}
