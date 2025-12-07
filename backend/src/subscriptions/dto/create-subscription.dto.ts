import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
    @ApiProperty()
    @IsString()
    packageId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bankAccountId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    paymentProofUrl?: string;
}
