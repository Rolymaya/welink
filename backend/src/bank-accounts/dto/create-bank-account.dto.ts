import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
    @ApiProperty({ example: 'Banco BAI' })
    @IsString()
    bankName: string;

    @ApiProperty({ example: 'Wenova Geração Lda' })
    @IsString()
    accountHolder: string;

    @ApiProperty({ example: 'AO06000000000000000000000' })
    @IsString()
    iban: string;

    @ApiPropertyOptional({ example: 'BAIAAOLU' })
    @IsOptional()
    @IsString()
    swift?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    organizationId?: string;
}
