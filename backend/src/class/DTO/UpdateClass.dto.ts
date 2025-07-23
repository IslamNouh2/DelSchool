import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateClassDto {
    @IsOptional()
    @IsString()
    ClassName: string;

    @IsString()
    @IsOptional()
    code: string;

    @IsOptional()
    @IsString()
    localName: string;

    @IsInt()
    @IsOptional()
    NumStudent: number;

    @IsOptional()
    @IsString()
    okBlock: string;
}