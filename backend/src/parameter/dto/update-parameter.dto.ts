import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateParameterDto {
    @IsOptional()
    @IsBoolean()
    okActive?: boolean;

    @IsOptional()
    @IsString()
    paramValue?: string;
}