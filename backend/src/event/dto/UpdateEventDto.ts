import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './CreateEventDto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
