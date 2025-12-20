import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBankAccountDto {
    @IsString()
    @IsNotEmpty()
    accountHolder: string;

    @IsString()
    @IsNotEmpty()
    bankName: string;

    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @IsString()
    @IsOptional()
    iban?: string;

    @IsString()
    @IsOptional()
    swift?: string;
}
