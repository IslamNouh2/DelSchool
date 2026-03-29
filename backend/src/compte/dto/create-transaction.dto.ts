import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

export enum TransactionType {
  DEBIT = 'DEBIT', // Encaissement (In)
  CREDIT = 'CREDIT', // Décaissement (Out)
}

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  description: string;

  @IsNumber()
  contraAccountId: number; // The other side of the transaction (e.g. Expense Account)

  @IsOptional()
  @IsString()
  date?: string;
}
