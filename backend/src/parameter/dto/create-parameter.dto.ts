import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateParameterDto {
    @IsString()
    paramName: string;

    @IsOptional()
    @IsBoolean()
    okActive?: boolean;
}

