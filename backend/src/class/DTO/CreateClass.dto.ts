import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateClassDto {
    @IsString()
    @IsNotEmpty()
    ClassName: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsNotEmpty()
    @IsString()
    localName: string;

    @IsInt()
    @IsNotEmpty()
    NumStudent: number;

    @IsOptional()
    @IsString()
    okBlock: string;
}