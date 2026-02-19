import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CollectPaymentDto {
    @IsNumber()
    feeId: number;

    @IsNumber()
    amount: number;

    @IsString()
    method: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    compteId?: number;
}
