import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateParameterDto {
    @IsOptional()
    @IsBoolean()
    okActive?: boolean;
  }