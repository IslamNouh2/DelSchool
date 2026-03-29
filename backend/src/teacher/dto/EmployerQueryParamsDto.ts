import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class EmployerNameSearchDto {
  @IsOptional()
  @IsNumberString() // <--- expects numeric string like "1", "10"
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
