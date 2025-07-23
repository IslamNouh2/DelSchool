import { IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
    @ApiProperty({ example: 'Mathematics' })
    @IsNotEmpty()
    @MaxLength(100)
    subjectName: string;

    @ApiProperty({ example: 20 })
    @IsInt()
    @Min(1)
    totalGrads: number;

    @ApiProperty({ example: -1, required: false })
    @IsOptional()
    @IsInt()
    parentId?: number;
}
