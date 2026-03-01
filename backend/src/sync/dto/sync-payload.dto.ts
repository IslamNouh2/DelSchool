import { IsArray, IsEnum, IsObject, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SyncOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class SyncOperationDto {
  @IsString()
  operationId: string;

  @IsEnum(SyncOperationType)
  type: SyncOperationType;

  @IsString()
  entity: string; // e.g., 'Student', 'Fee', 'Employer', etc.

  @IsObject()
  data: any;

  @IsOptional()
  version?: number;
}

export class BulkSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}
