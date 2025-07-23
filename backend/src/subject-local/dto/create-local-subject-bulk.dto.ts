// src/local-subject/dto/create-local-subject-bulk.dto.ts
import { IsInt, IsArray } from 'class-validator';

export class CreateLocalSubjectBulkDto {
    @IsInt()
    localId: number;

    @IsArray()
    subjectIds: number[];
}
